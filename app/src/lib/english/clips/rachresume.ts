// REVIEW 2026-11-16: pass 2, fix 15, drop 2, new 1; ear checks 1
// “Rachel's Job Search Isn't Going Well... | Friends” (the official Friends channel, Best of Season 1): Rachel sends
// résumés out for any job to escape waitressing; a friend's hints reveal a mistake on all of them.
// Segments from the captions, words from whisper (2026-11-16). Speech runs only 13–55 s; whisper loops its last line
// from 54 s, and the captions garble 33 s ("BR did you proof for days"), so that question is quoted from whisper and
// keys only on the reply. The friends besides Rachel are never named in the audio, so items call them "a friend".
// EAR CHECK: 53.8 s nt1 — "the Xerox machine caught a few" (assumed); whisper "caught a fuel", captions "caught a" … "fuel" after the music
import type { Clip } from '../types.ts';

export const rachResume: Clip = {
  id: 'rachresume', video: 'X6lSFA-QuMk', title: 'Rachel\'s Job Search Isn\'t Going Well...', dur: 66, wpm: 205,
  band: 'fast', tags: ['職場', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    { id: 'x1', skill: 'dict', level: 'B2', point: 'low', seg: [12.8, 15.6],
      stem: 'Type what the friend says: “Oh, Rach, we’re ___ resumes.” (3 words)', answer: 'running low on',
      cue: '「Rach」のすぐあと、resumes の前。',
      line: 'Oh, Rach, we’re *running low on* resumes over here.',
      said: '「履歴書が残り少なくなってきたよ」と声をかける。',
      mean: 'run low on ＝ 残り少なくなる。low と on がつながり「ロウォン」に聞こえる。',
      trap: 'running は g が落ちて「ラニン」。low on も1語に聞こえやすい。3語と数えて書く。',
      use: 'We’re running low on gas.（ガソリンが少なくなってきた）' },

    // R fix: V2 (blind 55 %, right): the "let go" and "one magazine" fillers were thin. Both distractors now give a
    //   full reason for sending many résumés, so all three explain the stem.
    // why: just lost her job ← "cannot be a waitress anymore" heard as having been fired; one magazine plus backups ←
    //   the one employer named, with the pile read as a safety net
    { id: 'g1', skill: 'gist', level: 'B2', point: 'quit', reveals: ['anything'], seg: [12.8, 32.7],
      stem: 'Why is Rachel sending out so many résumés?',
      choices: ['She wants out of her job, whatever comes next', 'She has just lost her job and needs any work',
                'She is aiming for one magazine and wants backups'], a: 0,
      cue: '「I’m going for」から「I mean it」までの言い方。',
      said: '「何でも応募する。もうウェイトレスは無理」と話す。',
      mean: '辞めさせられたのではなく、自分から抜け出したい。だから手当たり次第に送っている。',
      trap: 'cannot be … anymore を「クビになった」と取りやすい。主語は自分で、気持ちの話。',
      use: 'I’m ready for a change.（そろそろ環境を変えたい）' },

    // R fix: V2 (blind 55 %, right): "Don't you really want" is odd word order, so it fell away blind; it is now
    //   "Would you". The old `mean` said present-tense "want" rules out "Did you", but want is the base form after
    //   did as well. The note now points at the first consonant.
    // why: Did you ← "do you" shrinks to "d'ya", which "did you" also becomes; Would you ← a weak "w'd you" is close
    //   to "d'you", and the hypothetical fits a doubtful question
    { id: 's1', skill: 'sound', level: 'B2', point: 'doyou', seg: [15.3, 18.3],
      stem: 'Fill the gap: “___ really want a job with Popular Mechanics?”',
      choices: ['Do you', 'Did you', 'Would you'], a: 0,
      cue: '文の最初、とても短くつながった2語。',
      line: '*Do you* really want a job with Popular Mechanics?',
      said: '「本当にそこで働きたいの？」と聞いている。',
      mean: 'Do you は「ダユ」「ジャ」のように弱く短くなる。2語で1拍ほどの長さ。',
      trap: 'Did you も「ジュ」に縮み、弱い would も「ウ」が消えやすい。最初の子音、d か w かで聞き分ける。',
      use: 'D’you wanna grab lunch?（お昼食べに行く？）' },

    // R fix: V2 (blind 70 %, right): the "cars" and "pays better" fillers were weak. The face-value reading of "the
    //   ones to work for" is now a full distractor, and a second one reads the reply as a jab at the magazine.
    // why: great place ← "the ones to work for" is the usual praise of a good employer, taken at face value; nobody
    //   reads it ← after "Do you really want…", a jab at the magazine is the expected tease
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ones', seg: [15.3, 22.6],
      stem: 'Why is the reply to the Popular Mechanics question funny?',
      choices: ['It treats the name as “mechanics who are popular”', 'It praises the magazine as a great place to work',
                'It teases her that nobody reads that magazine'], a: 0,
      cue: '「the ones」が何を指しているか。',
      line: 'Well, if you’re gonna work for *mechanics*, *those are the ones* to work for.',
      said: '「整備士の下で働くなら、その人たちだね」と返す。',
      mean: '会社の名前を「人気のある整備士たち」と文字通りに取ってみせる、ことば遊び。',
      trap: 'the ones to work for はほめる形なので本気に聞こえる。Popular を形容詞にしている。',
      use: 'If you’re splurging, this is the place.（ぜいたくするなら、ここだね）' },

    // R fix: V2 (blind 70 %, right): "offers to help" was a filler. It is now 本当に？ read as admiration, a Japanese
    //   frame. S4: the segment ended at 25.55 s, mid-run into "I cannot…", and now ends at 27.7 s, before "I'm sick".
    // why: applied ← "a job with…" heard as a plain yes/no question about her applications; impressed ← 本当に？ as
    //   admiration (a Japanese frame)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'really', reveals: ['anything', 'doyou'], seg: [15.3, 27.7],
      stem: 'What does the friend’s question about Popular Mechanics do?',
      choices: ['It hints the job doesn’t suit her', 'It asks whether she has applied there yet',
                'It shows surprise at how good the job is'], a: 0,
      cue: '「really」の強さと、Rachel の返事の調子。',
      line: 'Do you *really* want a job with Popular Mechanics? — Hey, look… *I’m going for anything* here, okay?',
      said: '「本当にそこで？」と聞かれ、Rachel は「何でも応募してるの」と返す。',
      mean: 'really の入った質問は確認でなく疑い。「向いてる？」という遠回しな指摘。',
      trap: '「本当に？」は感心にも聞こえるが、強い really は疑い。返事の調子で確かめる。',
      use: 'Do you really want to wait two hours?（本当に2時間も待つ気？）' },

    // R fix: V2 (blind 55 %, right): reworded so the key isn't the only choice about talking. All three now say what
    //   the word does to the listeners. S4: it ends at 27.7 s (27.8 cut into whisper's "I'm" at 27.8 s).
    // why: look at ← look = 見る; noticed ← "Hey, look!" is also how you point at something you've just seen
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', reveals: ['anything'], seg: [22.6, 27.7],
      stem: 'What does the short word after Rachel’s “Hey” do?',
      choices: ['It calls for their attention before she pushes back', 'It asks them to look at the résumé in her hand',
                'It points to something she has just noticed'], a: 0,
      cue: '「Hey」のあと、you guys の前の一語。',
      line: 'Hey, *look*, you guys, I’m going for anything here, okay?',
      said: '「ちょっと聞いて、みんな」と、言い返す前に注意を引いている。',
      mean: '文頭の look は「見て」でなく「いい？聞いて」。言い返すときや、本気の話の前置き。',
      trap: 'look を「見る」と取りやすい。文頭で目的語のない look は、話を聞いてほしい合図。',
      use: 'Look, I’m doing my best here.（いい？これでも精一杯なの）' },

    // R fix: V2 (blind 65 %, right): "willing to try for" plus "any job" lined up too neatly, and "computer skills"
    //   was a late-clip filler. The stem now asks how choosy she is, and each distractor is a condition built from a
    //   clip word (the magazine, the tips).
    // why: magazines ← the one employer just named is a magazine; better pay ← "lousy tips" a few seconds later
    { id: 'd4', skill: 'detail', level: 'B1', point: 'anything', seg: [22.6, 27.7],
      stem: 'How choosy is Rachel being about jobs?',
      choices: ['Not at all: she’ll go after anything', 'Fairly: only magazines and fashion',
                'Somewhat: only jobs that pay better'], a: 0,
      cue: '「I’m going for」のあと。',
      line: 'I’m going for *anything* here, okay?',
      said: '「どんな仕事でも応募する」と言っている。',
      mean: 'go for ～ ＝ 〜を狙う、〜に挑む。anything で「選んでいられない」気持ちが出る。',
      trap: '前に雑誌の名前、あとにチップの不満が出るので、条件付きに聞こえやすい。anything はすべてを含む。',
      use: 'I’ll take anything with a window seat.（窓側ならどこでもいいです）' },

    // R drop: d2 (detail, "waitress"/"actress"/"hostess"): V1. Blind 75 %, because her job is backstory and on screen
    //   (Central Perk); the near-sound test never comes into play. Replaced by d5.

    // R fix: V2 (blind 60 %, right): "about leaving her job" in the stem pointed at firmness. The stem now names
    //   the moment, and "worried" is a real reading of "I cannot…". reveals: dropped 'waitress' (d2 is gone).
    // why: amused ← the friends were joking just before; worried ← "I cannot…" heard as fear, not resolve
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'meanit', seg: [22.6, 27.7],
      stem: 'How does Rachel sound when she says she can’t be a waitress anymore?',
      choices: ['Determined; she really means to quit', 'Amused; she is playing along with them',
                'Worried; she may not find work'],
      a: 0,
      cue: '文の最後に付け足す、短い一言。',
      line: 'I cannot be a waitress anymore. *I mean it.*',
      said: '「もうウェイトレスは無理」と言い、「本気だよ」と付け足す。',
      mean: 'I mean it ＝ 冗談じゃなく本気。直前のからかいに、まじめに返している。',
      trap: '周りが冗談を言っているので同じ調子に聞こえやすい。I mean it は冗談を打ち消す一言。',
      use: 'Call me anytime. I mean it.（いつでも電話して。本気で）' },

    // why: long hours ← the usual waitress complaint (script); rude manager ← another stock workplace complaint
    { id: 'd1', skill: 'detail', level: 'B1', point: 'tips', reveals: ['sick'], seg: [25.5, 32.7],
      stem: 'What is the first thing Rachel says she is fed up with?',
      choices: ['The poor tips', 'The long hours', 'The rude manager'], a: 0,
      cue: '「sick of the」のあと。',
      line: 'I’m sick of the *lousy tips*…',
      said: '「ひどいチップにはうんざり」と言っている。',
      mean: 'lousy ＝ ひどい、しょぼい。チップは給仕の大事な収入なので切実な不満。',
      trap: 'lousy の l は弱く「ラウジー」と短い。長時間労働はよくある不満だが、ここでは言っていない。',
      use: 'The coffee here is lousy.（ここのコーヒー、ひどいね）' },

    // R fix: V2 (blind 70 %, right): "list of complaints" in the stem answered it. The stem is neutral now, and all
    //   three are feelings about the job. reveals: + 'excuse' (the line shows "excuse me").
    // why: ill ← sick = 病気 (literal); scared to lose it ← a run of complaints can sound like fear for the job
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'sick', reveals: ['tips', 'excuse'], seg: [25.5, 32.7],
      stem: 'How does Rachel describe her feelings about the job?',
      choices: ['She has had more than enough of it', 'It is making her feel physically ill',
                'She is scared she might lose it'], a: 0,
      cue: 'リストの前に2回くり返す言い方。',
      line: 'I’m *sick of* the lousy tips, *sick of* being called “excuse me.”',
      said: '「チップにも、すみませんと呼ばれるのにも、うんざり」と言う。',
      mean: 'be sick of ～ ＝ 〜にうんざり。2回くり返し、不満の積み重なりを示す。',
      trap: 'sick を「病気」と取ると体調の話になる。of のあとに不満の中身が来たら「うんざり」。',
      use: 'I’m sick of this rain.（この雨にはもううんざり）' },

    // R fix: V2 (blind 60 %, right): the key was the only choice about her as a person. The distractors are now
    //   fuller readings of "excuse me" (an apology, a scolding), and the key states the fact rather than the grievance.
    // why: apologizing ← excuse me = すみません, heard as customers saying sorry; complain ← a sharp "Excuse me!" is
    //   also how a customer starts a complaint
    { id: 'i1', skill: 'infer', level: 'C1', point: 'excuse', seg: [25.5, 32.7],
      stem: 'What does Rachel’s last complaint tell us about the customers?',
      choices: ['They call out to her without using her name', 'They keep apologizing for small requests',
                'They complain to her about the service'], a: 0,
      cue: '最後の不満で、excuse me が何として使われているか。',
      line: '…sick of being *called “excuse me.”*',
      said: '「『すみません』と呼ばれるのにうんざり」と言う。',
      mean: '客は名前でなく Excuse me! で店員を呼ぶ。人として見てもらえない、という不満。',
      trap: 'excuse me を謝罪と取りやすいが、being called のあとなので呼び名。',
      use: 'Excuse me, could we get the check?（すみません、お会計お願いします）' },

    // R new: d5 replaces d2, which keeps literal at 4. It shares i1's point and is the plain-detail version of the
    //   same fact. Blind (fresh read): 40 %; "Hey, miss" is as likely a guess as the key.
    // why: Hey, miss ← the usual way a diner hails a waitress (script); Waitress ← said a line earlier, in her own
    //   sentence
    { id: 'd5', skill: 'detail', level: 'B1', point: 'excuse', seg: [25.5, 32.7],
      stem: 'At the end of her list, what does Rachel say people call her?',
      choices: ['“Excuse me”', '“Hey, miss”', '“Waitress”'], a: 0,
      cue: '「being called」のあと。',
      line: '…sick of being called *“excuse me.”*',
      said: '「『すみません』と呼ばれるのにうんざり」と言っている。',
      mean: '客は名前でなく Excuse me! と声をかけて呼ぶ。それが呼び名になっている。',
      trap: '店員の呼び方は他にもあるので、being called のあとの語をそのまま聞く。',
      use: 'Excuse me, is this seat taken?（すみません、この席空いてますか）' },

    // R fix: V2 (blind 60 %, right) and §9.6: the key was the only two-part choice. All three now have two parts.
    // why: no ← the hesitant "uh" sounds like the start of a no; not all ← a hedged middle answer
    { id: 'd3', skill: 'detail', level: 'B1', point: 'proofread', seg: [32.7, 37.4],
      stem: 'When a friend asks about checking the résumés, what does Rachel answer?',
      choices: ['Yes, and asks why they ask', 'No, and asks if she needed to', 'Not all, and asks which ones'], a: 0,
      cue: '質問のすぐあと、短い返事と問い返し。',
      line: 'Rach, did you proofread these? — Uh, *yeah, why?*',
      said: '「校正した？」と聞かれ、「うん、なんで？」と答える。',
      mean: '確認したつもりでいる返事。why? と聞き返すので、問題に気づいていない。',
      trap: '最初の uh で no に聞こえやすい。uh は考える間で、そのあとの yeah が答え。',
      use: 'Yeah, why? Is something wrong?（うん、なんで？何かあった？）' },

    // R fix: V2 (blind 55 %, right): "lost interest" was a filler, and "won't say" was the only choice with an
    //   inner state. All three are now readings of a hesitant "nothing". V5: B2 → C1, because the stance is
    //   implicit. S4: it ends at 43.3 s; 43.6 s ran into whisper's "Oh" at 43.5 s.
    // why: nothing worth worrying about ← "nothing" taken literally, as reassurance; only skimmed ← "uh" heard as
    //   not having looked properly
    { id: 'i3', skill: 'infer', level: 'C1', point: 'mistake', seg: [32.7, 43.3],
      stem: 'After Rachel asks “why?”, what does the friend’s first reply suggest?',
      choices: ['The friend noticed something but holds it back', 'The friend found nothing worth worrying about',
                'The friend only skimmed them and can’t tell'], a: 0,
      cue: '「why?」への返事の最初、ためらいの音。',
      line: 'Uh, yeah, why? — *Uh, nothing.*',
      said: '「なんで？」と聞かれ、「えっと、なんでもない」と答える。',
      mean: 'ためらってからの nothing は、言いにくいことがあるサイン。このあと遠回しにほのめかす。',
      trap: 'nothing を「問題なし」と取りやすい。前の uh と、校正したかという質問がヒント。',
      use: 'Oh, nothing. Never mind.（ううん、何でもない）' },

    // R fix: V2 (blind 70 %, right) and §9.6: the key was the only "No". There are now two Nos: the other one reads
    //   the sarcasm as aimed at her job choices, which the proofread question rules out. S4: it ends at 43.3 s.
    // why: mocks the jobs ← the friends teased her about Popular Mechanics a moment ago; praises a skill ←
    //   "impressed… excellent" taken at face value
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'mistake', seg: [32.7, 43.3],
      stem: 'When the friend mentions her computer skills, is it sincere?',
      choices: ['No; it hints she made a mistake', 'No; it mocks the jobs she’s applying for',
                'Yes; it praises a skill on her résumé'], a: 0,
      cue: '「proofread」の質問と、そのあとのためらい。',
      line: 'I’m sure they’ll be impressed with your *excellent computer skills*.',
      said: '「すばらしいパソコンの腕前に、きっと感心するよ」と言う。',
      mean: '校正したか聞いた直後のほめ言葉は皮肉。その行こそ誤字だ、とほのめかしている。',
      trap: 'impressed や excellent をそのまま取りやすい。ためらいのあとの大げさなほめ言葉は皮肉。',
      use: 'Oh, great job. Really.（いやあ、お見事。ほんとに）' },

    // R fix: V2 (blind 60 %, right): the "hope they call" filler is replaced with a C2 near miss: the right mechanism
    //   (sarcasm) aimed at the wrong target (her computer skills, not the page). S4: it ends at 43.3 s.
    // why: not that bad with computers ← sarcasm caught, but taken as a jab at her skills, the words said;
    //   just being nice ← praise heard as a kind exaggeration (the お礼 frame)
    // anchor: 33.2–38.6 s "did you proofread these?", then the hesitant "Uh, nothing.": the praise that follows comes
    //   from someone who has just checked her spelling, and 43.8 s "Oh my God!" is what catching it sounds like
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'mistake', seg: [32.7, 43.3],
      stem: 'Which reply from Rachel would show she caught the friend’s meaning?',
      choices: ['Wait. What’s wrong with them?', 'Hey, I’m not that bad with computers!',
                'Oh, stop. You’re just being nice.'], a: 0,
      cue: 'ほめ言葉の前の、質問とためらい。',
      line: 'Uh, nothing. I’m sure they’ll be *impressed* with your *excellent computer skills*.',
      said: '校正したか聞いて、言いよどんでから「パソコンの腕前に感心するよ」と言う。',
      mean: 'ほめ言葉の形の皮肉で、本当は「ミスがある」と伝えている。気づいたなら、何が悪いのか聞き返す。',
      trap: '皮肉に気づいても、言われた語（computer）に反論しがち。返事は言葉の形でなく、相手の伝えたいことに返す。',
      use: 'Hang on, what’s that supposed to mean?（待って、それどういう意味？）', retired: true },

    // R fix: V2 (blind 75 %, right): the title says it goes badly, so the two good-news distractors fell away. Both
    //   are now bad news. The key no longer says "all", and reveals gains 'all', because the key still names the
    //   error that nt1's "all of them" turns on.
    // why: wrong addresses ← a pile of résumés gone out, and an error about where they went; job taken ← the
    //   job-hunt script's usual setback
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['mistake', 'all'], seg: [32.7, 56],
      stem: 'What does Rachel find out in the second half?',
      choices: ['Her résumés have a mistake on them', 'She sent them to the wrong place',
                'The job she wanted is already taken'],
      a: 0,
      cue: '後半、校正の質問から最後まで。',
      said: '校正したか聞かれ、遠回しな皮肉で、送った履歴書に誤字があると気づく。',
      mean: '仕事探しの意気込みが、自分のミスで台無しになるという流れ。',
      trap: 'うまくいかない話だと分かっていても、何が悪いのかは後半の質問と皮肉で決まる。住所も採用枠の話も出てこない。',
      use: 'Always double-check before you send it.（送る前に必ず見直してね）' },

    // R drop: i4 (infer, "what is 'it'?"): V2/V3. Blind 75 %; after the proofread hints the referent is obvious, and
    //   every honest distractor ("the computer-skills line") would be a second key. g2 and nt1 already cover it.

    // R fix: V2 (blind 75 %, right): the two literal readings were too far from the key. One distractor is now the
    //   C2 "right direction, wrong mechanism" (not all of them, but by timing).
    // why: copied before the mistake ← the reply's direction ("not all") with the wrong cause, built on "a few";
    //   jammed ← caught = 引っかかる, a paper-jam reading
    // anchor: 46.2–48 s "Do you think it's on all of them?", then 51.9–54 s "I'm sure the Xerox machine caught a few":
    //   a copier copies what it's given, so "caught" can only be a joke, and the joke means "yes, all of them"
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'all', reveals: ['doyou'], seg: [45.5, 55.5],
      stem: 'Taken seriously, what would the reply about the Xerox machine claim?',
      choices: ['That the copier corrected the mistake on a few', 'That a few were copied before she made the mistake',
                'That the copier jammed, so only a few went out'], a: 0,
      cue: 'コピー機に本当にできることと、caught の意味。',
      line: 'Do you think it’s on all of them? — Oh, no, I’m sure the *Xerox machine caught a few*.',
      said: '「全部に入ってる？」に、「いやいや、コピー機がいくつか見つけてくれたさ」と返す。',
      mean: '本気なら「コピー機が誤字を直した」になる。コピー機にそれはできないので、「全部に入ってる」の意味。',
      trap: 'caught を「紙が詰まる」と取ると本当の話に聞こえる。ありえない理由での安心は、反対の意味の冗談。',
      use: 'Oh sure, it’ll just fix itself.（ああ、勝手に直るよね）', retired: true },
  ]
};
