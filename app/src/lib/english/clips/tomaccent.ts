// REVIEW 2026-11-16: pass 2, fix 22, drop 0, new 0; ear checks 0
// Open question: a cold blind read by a fresh session, seeing all 23 choice items at once, still got 17 right at ≥ 50 %.
//   Most of its reasons came from other items' stems (d4/c1/h4, d1→h2, c2→g2), the title or knowing the show (April's
//   character, c2's line), which a single draw doesn't give. h2, h4 and h5 stay guessable on their own (a key that
//   explains the joke). Accept, or rework those three?
// (The author's one ear check, Tom as the speaker of "I know, it's so crazy…" at 205 s, is settled by
//   the turns: it answers Nadia's "This is to lease a hangar…", and whisper marks the speaker change there.)
// “Tom's British Accent | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Nadia, a doctor
// from Doctors Without Borders, comes to book a park for a free vaccine clinic; Tom panics and puts on a British accent,
// his coworker April enjoys it, he drops it with a "cold" excuse, then stalls Nadia with fake paperwork mix-ups because
// he's in love. She leaves without her park, wishing the whole office West Nile virus.
// Segments from the captions, words from whisper (2026-11-16). Only Tom, Nadia and April are named; the deadpan
// coworker at 4–58 s is "Tom's coworker" (April by the later scene, but not named there).
// Untested on purpose: 0–16 s (who says "Seriously? / No." in the policy joke is unclear), 78–87 s ("Sorry, West Nile"
// and "Cricket": speaker unclear), 131 s (whisper "it's gone", captions "that's gone"), 148 s ("Sure" / "I'm sure"),
// 150–156 s (crow's neck, glitter: visual), 173 s ("No follow-up to that?": speaker unclear), 188 s (whisper "last
// time", captions "last name is"), 230 s (whisper "stall", captions "stop"), 242–248 s (the airline joke needs Jay-Z).
// EAR CHECK: none
import type { Clip } from '../types.ts';

export const tomAccent: Clip = {
  id: 'tomaccent', video: 'o3Q9ivgnqYU', title: 'Tom\'s British Accent', dur: 302, wpm: 158, band: 'mid',
  tags: ['職場', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): the two joke uses were fillers; now three park requests, all about health or help. N6:
    //   notes 128 → under 120.
    // why: fundraiser ← "free" + "mobile hospital" heard as a charity event; staff ← "vaccinations" plus the coworker's
    //   "Can you help her?" heard as a request for helpers
    { id: 'g1', skill: 'gist', level: 'B1', point: 'purpose', seg: [0.3, 32.0],
      stem: 'What does Nadia want from the parks office?',
      choices: ['A park to give free vaccinations in', 'A park for a charity hospital fundraiser',
                'Park staff to help at her vaccine clinic'], a: 0,
      cue: '冗談のやりとりのあと、「I called earlier」から。',
      line: 'I called earlier about the *free vaccinations* thing… set up a *mobile hospital* in one of your parks.',
      said: '前に電話した無料の予防接種の件で、公園に移動式の病院を置きたいと話す。',
      mean: '冒頭は冗談の規則。本題は Doesn’t matter のあと。',
      trap: 'free や hospital から募金や人集めと取りやすい。頼んでいるのは場所。',
      use: 'I called earlier about my reservation.（予約の件で先ほど電話した者です）' },

    // R fix: S4 (the end cut "obviously"; now 59.6 s, after "How could I be from Russia?"). N6: notes 125 → under 120.
    // why: back him up ← "Tom's your guy" and "used to run the parks department" sound like a recommendation; explain
    //   the accent ← "his home country" heard as a real fact about him
    { id: 'i1', skill: 'infer', level: 'C1', point: 'russia', seg: [46.0, 59.6],
      stem: 'Why does Tom’s coworker say he ran a parks department in Russia?',
      choices: ['To tease him about his put-on accent', 'To back him up as an experienced hand',
                `To explain where his odd accent is from`], a: 0,
      cue: '「Tom’s your guy」のあとと、Tom の慌てた返し。',
      line: 'Yeah, *Tom’s your guy*. He actually used to run the parks department *in his home country of Russia*. — She’s joking.',
      said: '「Tom が適任よ。母国ロシアで公園課を仕切ってたの」に、Tom が「冗談だよ」。',
      mean: '推薦の形で、イギリス風のなまりをロシアなまり扱いしてからかっている。',
      trap: 'your guy で味方に聞こえやすい。本人が慌てて打ち消したら、からかいの合図。',
      use: 'Ask Mike. He’s your guy.（マイクに聞いて。彼が適任）' },

    // R fix: V2 (blind 55 %): the key was the only service-desk answer; now three "To get…" promises. S4: the end cut
    //   "Right this way", which the stem points at; now 66.0 s. N6: notes 123 → under 120.
    // why: papers in order ← sort = ソート・並べ替え (katakana); right person ← "Right this way" heard as sending her on
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'sorted', seg: [54.4, 66.0],
      stem: 'What does Tom promise Nadia just before “Right this way”?',
      choices: ['To get everything she needs arranged', 'To get her papers sorted into order',
                'To get her to the right person'], a: 0,
      cue: '「definitely」のあと、イギリス風の言い方。',
      line: 'We can definitely *get you sorted*. Right this way.',
      said: '「ちゃんと手配しますよ。こちらへどうぞ」と案内する。',
      mean: 'get 人 sorted ＝ 人の用事を片づける。イギリス英語らしい言い方で、演技の一部。',
      trap: 'sort をカタカナのソート（並べ替え）と取りやすい。get＋人＋sorted は人が主役。',
      use: 'Don’t worry, we’ll get you sorted.（ご心配なく、なんとかします）' },

    // R fix: V2 (blind 60 %): "lots of strange diseases" was the only vivid choice; the distractors now come from the
    //   scene's own words (hospital, vaccinations). N6: notes 129 → under 120.
    // why: run-down hospital ← "mobile hospital" from her first request; missed shots ← "free vaccinations" makes a
    //   vaccine gap sound like the reason
    { id: 'd1', skill: 'detail', level: 'B1', point: 'diseases', seg: [68.0, 79.0],
      stem: 'Why does Doctors Without Borders want to come to Pawnee?',
      choices: ['Pawnee is full of unusual illnesses', 'Pawnee’s only hospital is run-down',
                'Pawnee’s kids have missed their shots'], a: 0,
      cue: '質問のすぐあと、Pawnee を何にたとえるか。',
      line: 'Pawnee is like a *petri dish of weird diseases*.',
      said: '「Pawnee は変な病気の培養皿みたいなもの」と答える。',
      mean: 'petri dish ＝ 細菌を育てるシャーレ。変な病気が次々に出る町ということ。',
      trap: 'vaccinations や hospital から理由を想像しやすい。答えは like のあと。',
      use: 'This office is like a zoo today.（今日のオフィスは動物園みたい）' },

    // R fix: V2 (blind 75 %): the sports reading was a filler; now "glad Pawnee gets the clinic" (wins = gets). S3: the
    //   cue's "wins" was a key-only word. S4: the start was 0.08 s before "Did"; now 72.65 s, from “Pawnee is like a
    //   petri dish”. N6: notes 129 → under 120.
    // why: names ← the "Western Nile / West Nile" correction just before; clinic ← "wins" heard as Pawnee winning her
    //   clinic
    { id: 'h2', skill: 'humor', level: 'C1', point: 'wins', reveals: ['diseases'], seg: [72.65, 82.3],
      stem: 'Why is “Looks like Pawnee wins again” funny?',
      choices: ['He’s proud of a record nobody would want', 'He’s teasing her for mixing up the names',
                'He’s glad Pawnee gets the free clinic'], a: 0,
      cue: '直前の「higher rate」と、wins の組み合わせ。',
      line: 'you have a *higher rate* of the West Nile virus… Looks like *Pawnee wins again*.',
      said: '「本場よりウエストナイル熱が多い」と聞き、「また Pawnee の勝ちだね」と返す。',
      mean: '病気の多さは自慢にならないのに、競争に勝ったように喜ぶ。ずれた郷土愛が笑いどころ。',
      trap: 'wins を「得をする」と取りやすい。何と何を比べた直後かを聞く。',
      use: 'Looks like I win this round.（今回は私の勝ちみたい）' },

    // R fix: N6: notes 124 → under 120.
    { id: 'x1', skill: 'dict', level: 'B1', point: 'forms', seg: [87.0, 94.2],
      stem: 'Type the words: “Uh, just ___ and we will be all set.” (4 words)', answer: 'fill out these forms',
      cue: '「just」のすぐあと。動詞と次の語がつながる。',
      line: 'Uh, just *fill out these forms* and we will be all set…',
      said: '「この書類に記入すれば準備完了」と言う。',
      mean: 'fill out ＝ 書類に記入する。fill‿out が「フィラウ」とつながり、t はほぼ聞こえない。',
      trap: 'out が弱く短いので fill these と聞こえやすい。動詞のあとの小さな語を拾う。',
      use: 'Please fill out this form first.（まずこの用紙に記入してください）' },

    // R fix: N6: notes 134 → under 120.
    // why: you're going ← "gone" and "going" start alike and 've is weak; you went ← 've dropped, "gone" heard as a past
    //   tense; you've been ← 've caught, "gone" missed
    { id: 's1', skill: 'sound', level: 'B2', point: 'insane', seg: [96.8, 100.1],
      stem: 'Fill the gap: “So, ___ insane. That’s fun.”',
      choices: ['you’ve gone', 'you’re going', 'you went', 'you’ve been'], a: 0,
      cue: 'So のすぐあと、二語目の短い音。',
      line: 'So, *you’ve gone* insane. That’s fun.',
      said: '「つまり、おかしくなったのね。楽しい」と言う。',
      mean: '’ve はほぼ「v」だけ。gone は「ゴーン」より短く「ガン」に近い。',
      trap: '’ve が消えると you went、n を ing と取ると going に聞こえる。小さな v を待つ。',
      use: 'Have you lost your mind?（正気なの？）' },

    // R fix: V2 (blind 60 %): "too busy to notice him" was a filler; now "too sharp to fall for his act" (he has just been
    //   caught putting on a voice).
    // why: different world ← league = リーグ, "a different league" heard as "a different group"; too sharp ← after his
    //   fake accent, "she'd see through me" fits the panic
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'league', seg: [96.8, 104.65],
      stem: 'How does Tom describe Nadia when he explains why he panicked?',
      choices: ['As far too good for someone like him', 'As from a whole different world to his',
                'As too sharp to fall for his act'], a: 0,
      cue: '「I just panicked」のあと、She’s so で始まる文。',
      line: 'I just panicked. She’s so *out of my league*.',
      said: '「パニックになった。彼女は僕にはとても手が届かない」と打ち明ける。',
      mean: 'out of my league ＝ 自分とは格が違う、高嶺の花。恋愛でよく使う。',
      trap: 'league をカタカナのリーグと取ると「別の世界の人」に聞こえる。格の上下の話。',
      use: 'That restaurant is out of my league.（あの店は私には高すぎる）' },

    // R fix: V2 (blind 55 %): "worried" was a filler; now "a fuss over nothing" (the literal "Nothing"). N6: notes 127 →
    //   under 120.
    // why: impressed ← "This is amazing" taken as praise for the accent; fuss over nothing ← "Nothing" heard as "it's
    //   nothing, relax"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'amazing', seg: [96.8, 108.6],
      stem: 'When Tom asks April what he should do, how does she feel?',
      choices: ['She’s loving the mess too much to help', 'She’s impressed by how good his accent is',
                'She thinks he’s making a fuss over nothing'], a: 0,
      cue: '「What should I do?」への答えと、その前の一言。',
      line: 'What should I do? — *Nothing. This is amazing.*',
      said: '何をすればいいか聞かれ、「何もしないで。最高じゃない」と答える。',
      mean: '困っている彼を面白がっている。amazing はなまりでなく、この状況への言葉。',
      trap: 'Nothing を「大したことない」と取りやすいが、ここは「何もしないで」。',
      use: 'Don’t stop. This is too good.（やめないで、面白すぎる）' },

    // R fix: V2 (blind 55 %): "calling her over" was a filler; now a warning not to tell Nadia. K1: "begging" vs a
    //   rebuke turned on tone; the key now covers both ("drop the joke and help"). N6: notes 121 → under 120.
    // why: thanking ← "This is amazing" heard as a compliment, so the name reads as a warm "aw"; warning ← a name alone
    //   said as "don't you dare", with Nadia nearby
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'plea', seg: [104.68, 112.1],
      stem: 'When Tom answers her with just “April.”, what is he doing?',
      choices: ['Pushing her to drop the joke and help', 'Thanking her for saying he sounds great',
                'Warning her not to tell Nadia the truth'], a: 0,
      cue: '名前だけの一言と、そのあとの彼女の返事。',
      line: '*April.* — *Fine.* If you want to have a chance with her…',
      said: '名前だけを言われた April は「分かった」と折れ、まじめに助言を始める。',
      mean: '名前だけの一言は「頼むよ、まじめに」という訴え。Fine と折れたのがその証拠。',
      trap: '名前だけだと何の合図か迷いやすい。直後の返事が、言葉の働きを教えてくれる。',
      use: 'Come on. I’m serious.（ねえ、本気なんだって）' },

    // R fix: V2 (blind 50 %): the key alone quoted the clip ("the rest of your life"); now three readings of his
    //   reaction, none quoting. N6: notes 122 → under 120.
    // why: set them up ← "if you want to have a chance with her" heard as April offering help; hurt ← "obviously you
    //   have to stop" heard as harsh
    { id: 'h3', skill: 'humor', level: 'C1', point: 'marry', seg: [108.7, 117.4],
      stem: 'Why is Tom’s question at the end of April’s advice funny?',
      choices: ['He hears her warning as good news about Nadia', 'He takes her advice as an offer to set them up',
                'He hides his hurt at her advice with a joke'], a: 0,
      cue: '助言の最後の部分と、彼が飛びついた語。',
      line: 'It’s either that or you talk like that *for the rest of your life*. — *You think she’d marry me?*',
      said: '「やめるか、一生その話し方か」と言われ、「彼女、結婚してくれると思う？」と聞く。',
      mean: '一生なまりを続けるはめになるという警告を、一生いっしょにいられる話と受け取った。',
      trap: '唐突な結婚の話は照れ隠しに聞こえやすい。警告のどの語に飛びついたかを聞く。',
      use: 'Either you tell her, or I will.（君が言うか、私が言うかだ）' },

    // R fix: N6: notes 125 → under 120.
    // why: fourteen/forty ← -teen/-ty, and "four bags" runs together; two ← "a cappuccino, a latte" counted as two
    { id: 'n1', skill: 'number', level: 'B1', point: 'bags', seg: [119.6, 128.38], keep: true,
      stem: 'How many bags of coffee beans does Tom bring Nadia?',
      choices: ['two', 'four', 'fourteen', 'forty'], a: 1,
      cue: 'カプチーノとラテのあと、袋の数。',
      line: 'I got you a cappuccino, a latte, *four bags* of coffee beans and mini espresso machine.',
      said: '何がいいか分からず、カプチーノ、ラテ、豆4袋、エスプレッソマシンまで買ってきた。',
      mean: '量の多さがポイント。気に入られたくて、やりすぎている。',
      trap: 'four bags がつながると fourteen に聞こえやすい。-teen なら後ろが強く長くなる。',
      use: 'I got you a little of everything.（いろいろ少しずつ買ってきたよ）' },

    // why: London trip ← "British ways" heard as a place he'd been; too much talking ← "affected my voice" with a sore
    //   throat in mind
    { id: 'd3', skill: 'detail', level: 'B1', point: 'cold', seg: [134.2, 141.48],
      stem: 'How does Tom explain why his accent is gone?',
      choices: ['A cold he just had changed his voice', 'A trip to London changed his voice',
                'Too much talking changed his voice'], a: 0,
      cue: '「You know」のあと、最近あったこと。',
      line: 'I *had a cold recently*. I think that may have *affected my voice*, like, in certain British ways.',
      said: '「最近かぜをひいて、そのせいで声がちょっとイギリス風になったみたい」と言う。',
      mean: 'なまりが消えたことを、かぜのせいにする苦しい言い訳。',
      trap: 'British が聞こえると旅行の話と取りやすい。理由は I had a のあとの一語。',
      use: 'Sorry, I had a cold last week.（ごめん、先週かぜをひいてて）' },

    // R fix: V2 (blind 50 %): "get her to ask more" was a filler; now "check whether she believes his excuse". S1: the
    //   stem said "his cold story", which gave d3's key to anyone who saw p2 first.
    // why: check belief ← "so…" heard as a tag question and "questions" as an invitation; own up ← "that's all there is
    //   to that story" heard as owning up to a "story" (作り話)
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'noqs', reveals: ['cold'], seg: [134.2, 147.7],
      stem: 'Right after explaining his lost accent, what is Tom’s next line meant to do?',
      choices: ['To shut down any more talk about it', 'To check whether she believes his excuse',
                'To own up that his excuse was made up'], a: 0,
      cue: '「Well」で始まる文の、最後の数語。',
      line: 'Well, *that’s all there is to that story*, so *no need for any more questions*.',
      said: '「話はそれで全部。だからもう質問は要らないね」と言う。',
      mean: '話題を打ち切る言い方。ばれたくないので、先回りして質問を封じている。',
      trap: 'story を「作り話」と取ると白状に聞こえる。ここは「その件」。no need for を聞く。',
      use: 'That’s all there is to it.（それだけの話だよ）' },

    // R fix: V2 (blind 55 %): "stay a little longer" was a filler; now "in no hurry, as long as it gets done" (the polite
    //   "if you could just"). N6: notes 131 → under 120.
    // why: return ← "not" lost in "I'm not actually gonna be attending"; no hurry ← the polite "if you could just" heard
    //   as patience
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'leave', seg: [172.6, 183.9],
      stem: 'When Nadia asks for the permit, how does she feel about Pawnee?',
      choices: ['She can’t wait to leave and be done with it', 'She’ll gladly return once the clinic is set',
                'She’s in no hurry, as long as it gets done'], a: 0,
      cue: '許可証を頼む文の、最後の部分。',
      line: 'so I can go home to Indianapolis and *never come back here*.',
      said: '「インディアナポリスに帰って、二度とここへ来なくて済むよう許可証を」と頼む。',
      mean: '丁寧な頼み方だが、本音は早くこの町を出たい。うんざりしている。',
      trap: 'if you could just の丁寧さで気長に聞こえやすい。最後の never で本音が分かる。',
      use: 'I just want to go home and sleep.（とにかく帰って寝たい）' },

    // R fix: V2 (blind 70 %): the key was the only natural sentence; added "actually not gonna" (the same words in the
    //   other natural order), so the order has to be heard. N6: notes 131 → under 120.
    // why: actually not ← the same words, in the order of the common "I'm actually not going"; exactly ← "actually"
    //   squeezed to "ak-chly"; now ← "not" with its t unreleased (and it flips the meaning)
    { id: 's2', skill: 'sound', level: 'B2', point: 'attend', reveals: ['leave'], seg: [172.6, 183.9],
      stem: 'Fill the gap: “Um, well, I’m ___ be attending the event.”',
      choices: ['not actually gonna', 'actually not gonna', 'not exactly gonna', 'now actually gonna'], a: 0,
      cue: 'I’m のすぐあと、三語がひと続き。',
      line: 'I’m *not actually gonna* be attending the event…',
      said: '「実はイベントには出ないので」と言う。',
      mean: 'not の t は止まるだけで音が出ず、actually は「アクチュリ」と短い。',
      trap: 'actually not の順でもよく言うので、語順は耳で決める。t が聞こえないと now にも聞こえる。',
      use: 'I’m not actually going tonight.（実は今夜は行かないんだ）' },

    // R fix: V2 (blind 60 %): "asking her out" was weak; now his own offer to help at her clinic, a minute earlier. N6:
    //   notes 128 → under 120.
    // why: help at clinic ← his "I'd love to come by, maybe help administer vaccines" a minute before; gifts ← the pile
    //   of coffee he just brought
    { id: 'd4', skill: 'detail', level: 'B2', point: 'plan', seg: [184.0, 194.1],
      stem: 'To the camera, how does Tom say he will keep Nadia in town?',
      choices: ['By letting the city’s red tape drag on', 'By offering to help out at her clinic',
                'By winning her over with gifts and coffee'], a: 0,
      cue: '「the most powerful weapon I have」のあと。',
      line: 'I’m going to keep her here, using the most powerful weapon I have: *bureaucratic incompetence*.',
      said: 'カメラに「恋をした。役所の無能さという最強の武器で引き止める」と話す。',
      mean: 'bureaucratic incompetence ＝ お役所のまずさ。手続きをわざと遅らせる作戦。',
      trap: 'コーヒー攻めや手伝いの申し出が耳に残る。weapon のあとが作戦。',
      use: 'Patience is my secret weapon.（忍耐が私の秘密兵器）' },

    // R fix: V2 (blind 75 %): the stem ("After Tom's words to the camera") pointed at the plan; it now names only the
    //   mix-up. "A real slip he now feels bad about" becomes the near miss "a real slip he's quietly glad of". N6: notes
    //   144 → under 140.
    // anchor: 189.0–193.9 s to camera "keep her here, using… bureaucratic incompetence"; then 196.4–210.7 s the form
    //   swap, "it almost sounds made up", "Bureaucracy, right? What are you gonna do?": the plan comes before the slip
    // why: glad of ← he wants her to stay, so a lucky error fits, and "Bureaucracy, right?" sounds like a real shrug;
    //   her slip ← "You filled out form 3208" puts the error on her
    { id: 'c1', skill: 'infer', level: 'C2', point: 'staged', reveals: ['plan'], seg: [188.75, 211.05],
      stem: 'When the form mix-up comes up, how should we hear it?',
      choices: ['As a stall he set up on purpose', 'As a real slip he’s quietly glad of',
                'As her slip, which he kindly covers'], a: 0,
      cue: 'カメラへの一言と、そのすぐあとの書類の話。',
      line: 'keep her here, using… *bureaucratic incompetence*. … — *Bureaucracy, right? What are you gonna do?*',
      said: 'カメラに「役所の無能さで引き止める」と話した直後、書類の番号違いが起き、「お役所だからね」と肩をすくめる。',
      mean: 'カメラへの一言が場面を書きかえる。偶然を喜んでいるのでなく、取り違えそのものが作戦。',
      trap: '本当のミスに乗じただけ、とも聞こえる。作戦の宣言が先にあることが決め手。',
      use: 'Traffic, right? What can you do?（渋滞だよね、しょうがない）' },

    // R fix: V2 (blind 75 %) + S3: the key alone said "made up", and the cue ("作戦と、made up") gave it away; now
    //   three readings of the line, the near miss being an open confession. S4: the segment lacked the plan it turns
    //   on; it now starts at the talking head (19.5 s, on purpose). N6: notes 122 → under 120.
    // why: rules ← "Bureaucracy, right?" right after, read as a sincere complaint; confessing ← "made up" heard as an
    //   admission, though he goes on blaming bureaucracy
    { id: 'h4', skill: 'humor', level: 'C1', point: 'staged', reveals: ['plan'], seg: [188.75, 208.28],
      stem: 'Why is “it almost sounds made up” funny here?',
      choices: ['He faked the mix-up, so it’s literally true', 'He’s mocking how silly the city’s rules are',
                'He’s openly confessing the trick to her'], a: 0,
      cue: 'この一言の前に、カメラに何と話したか。',
      line: 'This is to *lease a hangar at the airport*. — I know, it’s so crazy, *it almost sounds made up*.',
      said: '格納庫を借りる書類だと分かり、「変だよね、作り話みたい」と返される。',
      mean: '取り違えはわざとなので、本当に作り話。観客だけが知っていることで笑わせる。',
      trap: '白状にも聞こえるが、すぐ Bureaucracy と役所のせいにする。カメラへの作戦を思い出す。',
      use: 'I know, it sounds crazy, right?（でしょ、変な話だよね）' },

    // why: 3208 ← the form she did fill out, said just before; 3218/3280 ← one digit off, the same sounds in a run
    { id: 'n2', skill: 'number', level: 'B1', point: 'form', seg: [195.9, 202.4], keep: true,
      stem: 'Which form does Tom say Nadia should have filled out?',
      choices: ['3208', '3218', '3248', '3280'], a: 2,
      cue: '「supposed to」のあとの数字。',
      line: 'You filled out form 3208. You’re supposed to fill out form *3248*.',
      said: '「3208番に記入したね。本当は3248番だよ」と言う。',
      mean: '番号を一けたずつ読む言い方。二つの番号は三けた目だけが違う。',
      trap: '最初に聞いた番号が耳に残りやすい。supposed to のあとが正しいほう。',
      use: 'You’re supposed to use the other door.（反対のドアを使うことになってるよ）' },

    // R fix: V2 (blind 55 %): "one more way to keep her there" leaned on the story; now three short purposes, and the
    //   party reading becomes "celebrate the forms being done" (they aren't). N6: notes 127 → under 120.
    // why: sorry ← it comes right after the form trouble; celebrate ← "I guess we gotta make daiquiris now" heard as an
    //   end-of-work treat
    { id: 'i2', skill: 'infer', level: 'C1', point: 'stall', reveals: ['plan'], seg: [210.85, 217.7],
      stem: 'Why does Tom bring up the blender, fruit and rum?',
      choices: ['To make her stay a while longer', 'To say sorry for the form mix-up',
                'To celebrate the forms being done'], a: 0,
      cue: '「Huh, weird」の言い方と、誰が置いたのか。',
      line: '*Huh, weird.* *Someone left out* a blender, fresh fruits, and rum? I guess we gotta, like, make daiquiris now.',
      said: '「あれ、変だな。誰かがミキサーと果物とラムを置いてった。ダイキリを作るしかないね」',
      mean: '偶然を装っているが、自分で用意したもの。少しでも長く引き止める時間かせぎ。',
      trap: 'おわびに聞こえやすいが、おわびの言葉はない。わざとらしい驚きは仕込みの合図。',
      use: 'Oh, look! Someone left cookies out.（あれ、誰かがクッキーを置いてった）' },

    // R fix: V2 (blind 55 %): "Calm" was a filler; now "no park, angry at Tom alone" (her complaint is aimed at him), so
    //   "you all" decides it. N6: notes 139 → under 120.
    // why: Tom alone ← "You said that that park was ours… in a British accent" is aimed at Tom; another park ← Tom's
    //   "we'll pick another one" taken as settled
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['curse'], seg: [248.6, 281.9],
      stem: 'How does Nadia’s visit end?',
      choices: ['With no park, and furious at all of them', 'With no park, and angry at Tom alone',
                'With another park, after Tom’s offer'], a: 0,
      cue: '許可証を断られたあと、彼女の最後の言葉。',
      line: 'we *gave the park to someone else*. … I really hope *you all* get West Nile virus.',
      said: '公園は他に回ったと言われ、別の公園の話も断り、「みんな病気になれ」と帰る。',
      mean: '引き止め作戦は失敗。怒りは Tom だけでなく、この役所全体に向いている。',
      trap: '責めているのは Tom なので、怒りも彼だけと取りやすい。最後の you all まで聞く。',
      use: 'Well, that was a wasted trip.（来ただけ無駄だった）' },

    // R fix: V2 (blind 70 %): both distractors were fillers; now "blame his accent for a misunderstanding" and "mock the
    //   British for empty promises". N6: notes 125 → under 120.
    // why: misunderstanding ← "in a British accent" heard as "I couldn't follow you"; British ← "British" heard as a jab
    //   at the British
    { id: 'h5', skill: 'humor', level: 'C1', point: 'accentjab', seg: [264.65, 269.88],
      stem: 'Why does Nadia add “in a British accent” when she complains?',
      choices: ['To throw his dropped act back in his face', 'To blame his accent for a misunderstanding',
                'To mock the British for empty promises'], a: 0,
      cue: '約束の話のあとに付け足した、話し方の一言。',
      line: 'You said that that park was ours. You said it *a long time ago*, in a British accent.',
      said: '「あの公園は私たちのものだと言った。ずっと前に、イギリスなまりで」と言う。',
      mean: 'もうやめたなまりを持ち出し、あの時から嘘だったと突きつける。',
      trap: 'なまりのせいで聞き違えた、とも取れそうだが、約束の中身ははっきり覚えている。',
      use: 'You said that last week, remember?（先週そう言ったよね、覚えてる？）' },

    // R fix: V2 (blind 55 %): the key was the only one naming anger and guilt; now two hedged wishes that differ only
    //   in the target, plus the medical reading. N6: notes 144 → under 140.
    // anchor: 269.9–272.7 s two hedges ("shouldn't say this as a doctor", "probably not cool"), then 272.7–274.8 s "but
    //   I really hope you all get West Nile virus": "hope" settles wish vs warning, "you all" settles the target
    // why: Tom ← her anger so far is at Tom's broken promise, so "you" heard as him alone; doctor ← "as a doctor" + a
    //   virus name read as a medical warning, "hope" missed
    { id: 'c2', skill: 'infer', level: 'C2', point: 'curse', seg: [264.65, 275.6],
      stem: 'Which plain-English version keeps what Nadia means in her last complaint?',
      choices: ['“I know I shouldn’t, but I wish you all harm.”', '“I know I shouldn’t, but I wish Tom harm.”',
                '“As a doctor, I fear you’ll all catch it.”'], a: 0,
      cue: '「as a doctor」の前置きと、but のあとの動詞。',
      line: 'I *probably shouldn’t say this as a doctor*. It’s probably not cool, *but I really hope you all get West Nile virus*.',
      said: '「医者として言うべきじゃないし、よくないけど、みんなウエストナイル熱にかかればいいのに」と言う。',
      mean: '前置きは言ってはいけないと分かっている印。病気を防ぐ医者が病気を願うほど怒っている。',
      trap: '直前まで Tom を責めていたので、相手は彼だけと取りやすい。you all と hope を聞く。',
      use: 'I shouldn’t say this, but I’m glad he left.（言うべきじゃないけど、彼が辞めてよかった）' },
  ]
};
