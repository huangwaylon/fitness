// “Joey Is in a Crossword Puzzle | Friends” (the official Friends channel, Best of Season 8): Joey is a clue in a soap
// magazine's crossword and the friends make a fuss; he turned down a big profile, afraid of what he'd say after last
// time; Rachel urges him to do it, then asks him to mention her, and gets mocked for it.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈64 s; music to 75 s. Untested: the
// opening "Join/In the" (0.2 s), 23.7 s "do/did they call", 25.4 s "gonna/going to", 35.0 s "I said I'd write"
// (whisper) vs "I said I write" (captions; d3's key and line avoid the difference). No who item.
// EAR CHECK: 47.8–61.6 s t2 f2 d4 i3 nt1 nt2 — the speaker of "Oh, come on, Joey… Gal Pal Rachel Green?" is assumed
//   Rachel (she names herself, and the reply mocks that name); both sources agree on the words
// EAR CHECK: 30.5 s s1, 41.0 s x1 — the reductions "Why'd you" (≈ ワイジュ) and "who knows what I might" (linked,
//   weak t); both sources agree on the words
// REVIEW 2026-11-16: pass 6, fix 13, drop 0, new 0; ear checks 2
//   open: nt2's last letter "r" is at 73.9 s in the captions only; the segment now ends at 65 s, since no key needs it
import type { Clip } from '../types.ts';

export const joeyCrossword: Clip = {
  id: 'crossword', video: 'Ae1i7W2s9wY', title: 'Joey Is in a Crossword Puzzle', dur: 75, wpm: 170, band: 'mid',
  tags: ['友だち', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2, "name is wrong … plans to call" was a filler; now a keyword trap on "call you to tell you"
    // why: a call ← "did they call you to tell you" heard as what happened (the reply is "No"); argue over an answer
    //   ← the crossword frame and "What's Three Down doing?" heard as puzzling over a clue
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['topic'], seg: [0, 66],
      stem: 'Which best sums up the scene?',
      choices: ['Joey’s small fame gets a fuss, then the talk turns to an interview',
                'Joey finds himself in a puzzle, then the magazine calls him about it',
                'The friends work on the puzzle, then argue over one of the answers'], a: 0,
      cue: '前半の盛り上がりと、後半の話題の変わり方。',
      said: '前半は名前が載った話で盛り上がり、後半は取材を受けるかどうかの話になる。',
      mean: '小さな有名人ぶりを喜ぶ場面が、取材の誘いを巡る話に移る流れ。',
      trap: 'Blank を「名前が抜けた」と取ると苦情の話に思える。後半は interview が中心。',
      use: 'You’re famous now!（もう有名人だね！）' },

    // why: Thirteen ← "three" heard with a -teen tail; Thirty ← the -ty/-teen swap, with "down" right after
    { id: 'n1', skill: 'number', level: 'B1', point: 'clue', seg: [2.0, 7.0], keep: true,
      stem: 'Which crossword clue is Joey?',
      choices: ['Three Down', 'Thirteen Down', 'Thirty Down'], a: 0,
      cue: '「clue for」のすぐあと、数字の語尾。', line: 'guess who is the clue for *Three Down*?',
      said: '雑誌のクロスワードで、自分がタテの3番のヒントだと言う。',
      mean: 'Three Down ＝ タテの3番。このあと何度も出て、彼のあだ名のようになる。',
      trap: 'thirteen や thirty なら語尾に「ティーン」「ティ」が付く。three は短く終わる。',
      use: 'I’m stuck on seven across.（ヨコの7番で詰まってる）' },

    // R fix: V2, the key was the only happy choice; a second "Delighted" now differs on what the clue shows
    // why: hurt ← "Blank" heard as his first name left out; full name printed ← "Tribbiani" is read out, so the
    //   delight seems to be about seeing his name, but the clue has a blank, not "Joey"
    { id: 't1', skill: 'attitude', level: 'B1', point: 'thatsme', seg: [6.7, 13.5],
      stem: 'When Joey reads the clue aloud, how does he take it?',
      choices: ['Delighted: the blank is him', 'Hurt: his first name is left out',
                'Delighted: his full name is printed'], a: 0,
      cue: '読み上げた直後の、短い二つの文。', line: 'Blank Tribbiani. *That’s me! I’m Blank!*',
      said: 'ヒントを読み上げ、「それ僕だ！僕がブランクだ！」と続けて言う。',
      mean: '空欄に入る答えが自分だと喜んでいる。名前が載った興奮がそのまま出ている。',
      trap: 'Blank を「名前が抜けた」と取ると不満に聞こえる。短い感嘆の文が続いたら喜びの合図。',
      use: 'That’s me! I’m in the paper!（それ私！新聞に載ってる！）' },

    // why: busy lately ← "What's … doing?" read literally (何してるの？); which word ← the crossword frame, "Three
    //   Down" heard as the clue itself
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'married', reveals: ['clue'], seg: [13.5, 23.6],
      stem: 'At “What’s Three Down doing?”, what is the speaker doing?',
      choices: ['Telling him to stop flirting with her', 'Asking what Joey is busy with lately',
                'Asking which word fits in Three Down'], a: 0,
      cue: '「married」のあと、彼をどう呼ぶか。',
      line: 'Three Down *knows I’m married*. *What’s Three Down doing?*',
      said: '「3のタテは私が既婚だって知ってるよね。何してるの？」と言われ、彼は謝る。',
      mean: '彼をヒントの呼び名で呼び、口説くような言い方をやめさせている。',
      trap: 'What’s ～ doing? を文字通り「何してる？」と取りやすい。直後の Sorry が答え合わせ。',
      use: 'Easy there, I’m married.（ちょっと、私結婚してるのよ）' },

    // R fix: V2, the key was the only "No"; "mailed a copy" (a filler) is now "Not yet", from “gonna be in this”
    // why: phoned ← "call you to tell you" is heard in the question itself; not yet ← "your name is gonna be in
    //   this" heard as the future, as if it isn't out yet
    { id: 'd1', skill: 'detail', level: 'B1', point: 'call', seg: [23.3, 30.2],
      stem: 'Did the magazine let Joey know about the puzzle?',
      choices: ['No, nobody told him about it', 'Yes, they phoned him to tell him', 'Not yet, but they plan to'], a: 0,
      cue: '質問のすぐあと、最初の一語。', line: 'did they call you to tell you…? — *No.*',
      said: '「載るって連絡があったの？」と聞かれ、「ない」と答える。',
      mean: '雑誌からは何も知らされず、自分で見つけたということ。',
      trap: '質問の中の call you to tell you が耳に残り、yes と取りやすい。答えは最初の一語で決まる。',
      use: 'Nobody told me about it.（誰も教えてくれなかった）' },

    // R fix: V2, the key was the only face-saving reading and "another magazine" a filler; now a boast that the
    //   next line ("wanted to do a big profile") seems to back, and the choices are parallel
    // why: complaining ← the Japanese frame: not being told heard as a grievance; boasting they asked ← "really
    //   like me" + the profile offer just after, heard as them asking to put him in the puzzle
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'though', reveals: ['call'], seg: [23.3, 30.2],
      stem: 'Right after his “No,” what is Joey’s next sentence doing?',
      choices: ['Saving face: they still like him a lot', 'Complaining: they never tell him things',
                'Boasting: they asked to put him in it'], a: 0,
      cue: '文の最後の短い一語の働き。', line: 'No. They *really like me over there, though*.',
      said: '「連絡はなかった。でも、あそこの人たちには好かれてるんだ」と付け足す。',
      mean: '文末の though ＝「でもね」。連絡がなかった気まずさを自慢で取り戻す。',
      trap: '連絡なし＝不満と取りやすい。文末の though は、自分を立て直す合図にもなる。',
      use: 'It’s small. Great location, though.（狭いけど、場所は最高）' },

    // R fix: V2, "whether he should do an interview" stood out against two fillers; now all three are things
    //   to get Joey to do, each built on a word that is said
    // why: his own lines ← "write a lot of my own lines" is said, but about last time; fix his name ← "Blank" and
    //   "spelled" at the end seem to call for a name fix
    { id: 'g1', skill: 'gist', level: 'B1', point: 'topic', reveals: ['pep'], seg: [23.3, 61.9],
      stem: 'After the puzzle, what do the friends try to get Joey to do?',
      choices: ['Agree to do the interview', 'Write more of his own lines', 'Get his name fixed in print'], a: 0,
      cue: '「profile」のあと、何度も出てくる語。',
      said: '雑誌の大きな取材を断った理由を話し、友だちは受けるように勧める。',
      mean: '名前が載った話から、取材を受けるかどうかの相談へ移っている。',
      trap: 'own lines や spelled も聞こえるが、前回の話と最後の冗談。中心は取材を受けるかどうか。',
      use: 'Should I take the interview?（その取材、受けるべきかな）' },

    // R fix: V2, "a short list" contradicted "big", leaving the key; now "a page of facts" (katakana プロフィール)
    // why: page of facts ← katakana プロフィール = a data sheet; photo ← profile = 横顔 (a side view of the face)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'profile', seg: [26.1, 30.2],
      stem: 'What did they want to do with “a big profile on me”?',
      choices: ['Write a long story about him', 'Print a page of facts about him', 'Run a big photo of his face'], a: 0,
      cue: '「do a … on me」という形に注目。', line: 'They wanted to do *a big profile* on me, but I said no.',
      said: '「大きな特集記事を組みたいと言われたけど、断った」。',
      mean: 'do a profile on ～ ＝ 人物を取り上げた記事を書く。big なら大きな特集。',
      trap: 'カタカナのプロフィールは短い紹介文だが、英語の profile は記事一本分。横顔の意味もある。',
      use: 'They did a profile on our chef.（うちのシェフの特集記事が出た）' },

    // why: do ← did shrinks to a d that melts into "you"; would ← "'d" is also would's short form; didn't ← the
    //   n't is easy to imagine after a negative-sounding "say no"
    { id: 's1', skill: 'sound', level: 'B2', point: 'whyd', seg: [26.1, 31.8],
      stem: 'Fill the gap: “___ say no?”',
      choices: ['Why do you', 'Why’d you', 'Why would you', 'Why didn’t you'], a: 1,
      cue: '「said no」の直後、問いの出だし。', line: '*Why’d you* say no?',
      said: '断ったと聞いて「なんで断ったの？」と聞き返す。',
      mean: 'did が縮んで d だけ残り、Why’d you が「ワイジュ」のように続く。',
      trap: 'd が you に溶けて Why do you に聞こえやすい。過去の話なら did を疑う。',
      use: 'Why’d you leave so early?（なんでそんなに早く帰ったの？）' },

    // R fix: V2, "planning to leave" was a filler; now "did his own stunts", from “fall down the elevator shaft”
    // why: writers not good ← "the writers got mad" heard as the cause (he insulted them); own stunts ← "fall down
    //   the elevator shaft" heard as something he did himself
    { id: 'd3', skill: 'detail', level: 'B2', point: 'lines', seg: [31.55, 40.9],
      stem: 'What did Joey say in his last interview for the magazine?',
      choices: ['That he came up with many of his lines', 'That the show’s writers were not very good',
                'That he did his own stunts on the show'], a: 0,
      cue: '「last time」のあと、「I said」に続く部分。',
      line: 'I said I… write *a lot of my own lines*, and then the writers got mad',
      said: '前回の取材で「セリフの多くは自分で書いている」と話し、脚本家を怒らせた。',
      mean: '自分の手柄を大きく言ったせいで、脚本家の仕事を軽く見た形になった。',
      trap: 'writers got mad が耳に残ると、悪口を言ったと取りやすい。言った内容は自分の自慢。',
      use: 'I did most of the work myself.（作業のほとんどは自分でやった）' },

    // why: fewer lines ← "lines" + "got mad" pictured as a smaller part; a risky fall ← "fall down" taken as a real
    //   stunt, with "my character" missed
    { id: 'i1', skill: 'infer', level: 'C1', point: 'shaft', reveals: ['lines'], seg: [34.5, 40.9],
      stem: 'From Joey’s story, what did the writers do to him?',
      choices: ['Wrote his character out of the show', 'Gave his character fewer lines to say',
                'Made him do a risky fall on the set'], a: 0,
      cue: '「made」のあと、落ちたのは誰か。', line: 'made *my character fall down the elevator shaft*',
      said: '怒った脚本家が、彼の役をエレベーターの縦穴に落とした、と話す。',
      mean: '役を事故に遭わせて番組から消した、ということ。セリフの件への仕返し。',
      trap: 'fall を本人のスタントと取りやすい。主語の my character を聞けば、話の中の出来事。',
      use: 'They wrote him out of the show.（彼は番組から降ろされた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'whoknows', seg: [38.2, 43.3],
      stem: 'Type what Joey says: “So, ___ this time.” (6 words)', answer: 'who knows what i might say',
      cue: '「elevator shaft」のあと、「So」に続く部分。', line: 'So, *who knows what I might say* this time.',
      said: '「だから、今度は何を言っちゃうか分からないよ」と言う。',
      mean: 'who knows ＝ 誰にも分からない。問いではなく「さあね」という言い方。',
      trap: 'what I が「ワライ」とつながり、might の t も弱い。1語ずつ数えながら書く。',
      use: 'Who knows what tomorrow will bring?（明日はどうなるか分からない）' },

    // R fix: V2, the key was the only "nothing in it" choice and two fillers sat apart; now three parallel
    //   "It suggests…" readings of the same line
    // why: plan his answers ← "control the things you say" taken as sincere advice; the writers ← "control" right
    //   after the story of the writers punishing him
    { id: 'h1', skill: 'humor', level: 'C1', point: 'head', reveals: ['pep'], seg: [42.95, 49.2],
      stem: 'Why does the audience laugh at the friend’s “If only there was…”?',
      choices: ['It suggests Joey has no brain to stop him', 'It suggests Joey should plan his answers',
                'It suggests the writers still control him'], a: 0,
      cue: '文頭の言い方と、直後の反応。',
      line: '*If only there was something in your head* to control the things you say.',
      said: '「頭の中に、言うことを止めてくれる何かがあればねえ」と言う。',
      mean: 'If only ＝「〜があればいいのに（実はない）」。頭が空っぽだとからかっている。',
      trap: '助言に聞こえるが、If only は「ない」が前提。すぐかばう声が入るのも合図。',
      use: 'If only I had a map.（地図さえあればなあ）' },

    // R fix: V2, "keep notes" was a filler; now "your temper", the usual object of "keep it in check", which the
    //   line before ("control the things you say") rules out
    // why: facts ← check = チェック (確認する); temper ← the common collocation, with "it" not traced back
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'check', seg: [47.3, 51.5],
      stem: 'What does Rachel mean by “keep it in check this time”?',
      choices: ['You’ll keep what you say under control', 'You’ll check your facts before you talk',
                'You’ll keep your temper under control'], a: 0,
      cue: '直前の友だちの皮肉を、どう受けているか。', line: 'You will totally *keep it in check* this time.',
      said: '「今回はちゃんと抑えられるって」と励ます。',
      mean: 'keep ～ in check ＝ 〜を抑える。前の control the things you say の言いかえ。',
      trap: 'カタカナのチェック（確認）で取りやすいが、in check は「抑えた状態」。',
      use: 'Try to keep your spending in check.（出費は抑えめにね）' },

    // R fix: V2, "agrees he was right" was the odd one out; now a comforting reading of "come on… this time"
    // why: not his fault ← "Oh, come on" + "this time" heard as consoling him about last time; teasing ← it
    //   follows the "head" jab, so "come on" sounds like more mockery
    { id: 't2', skill: 'attitude', level: 'B2', point: 'pep', reveals: ['head'], seg: [47.3, 56.3],
      stem: 'When Rachel answers with “Oh, come on, Joey…”, what is her stance?',
      choices: ['She is pushing him to do the profile', 'She is telling him it wasn’t his fault',
                'She is teasing him like the friend did'], a: 0,
      cue: '呼びかけのあと、いくつ理由を並べるか。', line: 'Oh, *come on*, Joey… and *you deserve that*.',
      said: '「そう言わずに」と返し、理由を並べて「あなたにはその価値がある」と言う。',
      mean: 'come on はここでは「そう言わずに」。断った彼を、ほめながら説得している。',
      trap: '前の人のからかいに続くので、同じ冷やかしと取りやすい。理由を並べ始めたら説得の合図。',
      use: 'Oh, come on. You’d be great at it.（そう言わずに。君なら絶対うまくいく）' },

    // R fix: V2, "the writers would like him again" was weak; now "make up for last time" ("this time" just before)
    // why: pay ← the interview-means-money script; make up for last time ← "this time" and the story of the angry
    //   writers just before
    { id: 'd4', skill: 'detail', level: 'B1', point: 'career', seg: [47.3, 56.3],
      stem: 'What other reason does Rachel give for doing it?',
      choices: ['The publicity would help his career', 'The magazine would pay him quite a lot',
                'It would make up for last time'], a: 0,
      cue: '「and plus」のあと。', line: 'the publicity would be *really good for your career*',
      said: '「宣伝になるし、仕事のためにすごくいい」と言う。',
      mean: 'publicity ＝ 世間に知られること。取材を受ければ名前が売れる、という理由。',
      trap: '取材と聞くとお金の話を思いがちだが、出てくるのは career。お金の語は一度も出ない。',
      use: 'It’d be good for your career.（キャリアのためになるよ）' },

    // why: watch what he says ← her pep talk ("keep it in check") taken as the point; all his friends ← "gal pal"
    //   heard as the whole group
    { id: 'i3', skill: 'infer', level: 'C1', point: 'mention', seg: [47.3, 61.9],
      stem: 'What does Rachel’s advice end up asking Joey for?',
      choices: ['A mention of her own name in it', 'A promise to watch what he says',
                'A mention of all his friends'], a: 0,
      cue: '「mention」のあと、出てくる名前。',
      line: 'you could mention, oh, I don’t know, *Gal Pal Rachel Green*?',
      said: '説得の最後に「取材で、そうね、ギャルパルのレイチェル・グリーンとか？」と付け足す。',
      mean: '自分の名前を雑誌に載せたい。前の励ましは、このお願いへの前置きだった。',
      trap: '励ましを額面どおりに取ると、彼のためと思える。最後に出る名前が、話の本当の行き先。',
      use: 'Feel free to mention my name.（私の名前、出してくれていいよ）' },

    // R fix: V2, "every friend" was a weak scope trap; now a near miss on the label itself
    // why: can't decide ← "I don't know" read as real doubt (the literal hedge); a nicer title ← the hedge heard as
    //   unease about "gal pal", though she offers that label herself
    // anchor: 58.96–61.12 s "oh, I don't know" is followed at once by a ready-made label for herself, "Gal Pal
    //   Rachel Green" (both sources); 61.92–63.84 s the reply spells out "L-O-S-E…" at that one label
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'mention', seg: [56.0, 64.5],
      stem: 'When Rachel adds “oh, I don’t know,” what is she trying not to say?',
      choices: ['That she had picked herself all along', 'That she can’t decide which friend to name',
                'That she wants a nicer title than “gal pal”'], a: 0,
      cue: '「I don’t know」の直後に出る名前の形。',
      line: 'you could mention, *oh, I don’t know*, *Gal Pal Rachel Green*?',
      said: '迷うふりをしてから、「ギャルパルのレイチェル・グリーンとか？」と自分の名前を出す。',
      mean: '迷うふりは、決めていた答えを軽く見せる手。肩書き付きの名前がすぐ出るのが準備の証拠。',
      trap: 'I don’t know を本当の迷いと取りやすい。「さあ」の直後に具体的な答えが出たら、決めていた合図。',
      use: 'Maybe, oh, I don’t know… pizza?（そうだなあ、たとえば…ピザとか？）' },

    // why: Joey ← it follows the "nothing in your head" jab, so spelling a word out sounds aimed at him; the
    //   magazine ← "gal pal" is gossip-page talk, so the jab seems to hit the press
    // R fix: S4, the segment ran 19 s into the end music; cut to 65 s ("L-O-S-E" is in both sources by 63.8 s)
    // anchor: 61.92–63.84 s the subject is "that gal pal", the label Rachel gave herself two seconds before, and the
    //   letters spell L-O-S-E(-R)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'loser', reveals: ['mention'], seg: [56.0, 65.0],
      stem: 'In the reply “Is that Gal Pal spelled…”, who is the joke on?',
      choices: ['Rachel, for pushing herself into the story', 'Joey, as if he needs help with spelling',
                'The magazine, for its silly gossip labels'], a: 0,
      cue: '主語の that が指すものと、つづりの中身。', line: 'Is *that Gal Pal* spelled *L-O-S-E-R*?',
      said: '「そのギャルパルって、つづりは L-O-S-E-R？」と返す。',
      mean: '主語の that gal pal は Rachel が自分に付けた肩書き。それを「負け犬」とつづり、売り込みを笑う。',
      trap: '直前に Joey の頭をからかう流れがあり、Joey 向けに聞こえやすい。主語を追えば的は一人。',
      use: 'Is that “on time” spelled L-A-T-E?（その「時間どおり」って、つづりは L-A-T-E？）' },
  ]
};
