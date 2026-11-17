// “Just guys gently ribbing each other - The Office US” (the official The Office channel, BEST OF SEASON 2 - The Office
// US): Jim is having a party tonight and hasn't invited Michael. Michael, who hears about it, tries hard to be “one of
// the guys”; Jim teases him and calls it “gently ribbing”; Jim tells Dwight the party is a surprise to keep him quiet;
// and at five Michael asks around for evening plans and is turned down by everyone, Dwight last (“Clarinet”).
// Segments from the captions, words from whisper (2026-11-16). Jim is named at 88.3 s (“Jim, this is hardly the time”,
// which his reply answers) and Dwight at 226–253 s; the party is Jim's (“Barbecue at Jim's”, “your house for the
// party”). Untested, and no key rests on them: 46–48 s (“so like taking it off”/“It's all like taking it off”), 67 s
// (“you've had a slump”/“We've hit a slump”), 87 s (“no one can snap at the little thing”/“with their little
// finger”), 113 s (“a meal and a cup”/“in a cup”), 122.8 s (“free”/“pretty spicy tuna roll”), 124–132 s (who turns
// the delivery down), 158–160 s (“I was wondering”, whisper only), 255.6 s (“You too, Dwight”) and 265.9 s (“He has no
// idea”: whose).
// REVIEW 2026-11-16: pass 5, fix 18, drop 0, new 0; ear checks 1 (unchanged)
// OPEN: c2's anchor (154–171 s, Dwight asking for directions and told “it's a surprise”) lies outside its segment
//   (245.9–255.3 s), so a replay can't show it (S4); kept because the clip-internal callback is the point of the item
// OPEN: play-3 draws (seed 5, and 2/5/14/18 with “harder” on) can't place an unseen C2 (c1 reveals g2's `evening`;
//   c2 shares `clarinet` with h2). This was there before the review
// EAR CHECK: 11.2 s p1 — “Wonder where my e-vitation is” is Michael's (assumed: he is the one not invited, and his
//   talking head follows); if it's someone else, p1 goes
import type { Clip } from '../types.ts';

export const ribbing: Clip = {
  id: 'ribbing', video: 'C-TY__6zWhA', title: 'Just guys gently ribbing each other', dur: 289, wpm: 142, band: 'slow',
  tags: ['職場', '友だち'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2/K3, the distractors were incoherent (Michael planning the party); now Jim's cover story taken as true,
    //   and the “respect him” talk taken as his goal
    // why: surprise party ← “it's a surprise” (171 s) heard as the truth; respect as boss ← “I really respect him” and
    //   “You are the boss” kept, the “one of the guys” goal lost
    { id: 'g1', skill: 'gist', level: 'B2', point: 'snub', reveals: ['evite'], seg: [0, 175],
      stem: 'What is the first part of the clip mostly about?',
      choices: ['Michael tries to fit in while the staff plan a night without him',
                'Jim plans a surprise party for Michael and keeps it from him',
                'Michael tries to earn more respect from the staff as boss'], a: 0,
      cue: '招待の話と、Michael が何度も言う「仲間」。',
      said: 'パーティーの話が出る中で、Michael は部下たちに溶けこもうとする。',
      mean: '親しくなりたい上司と、上司抜きで楽しみたい部下たちのずれが場面の軸。',
      trap: 'サプライズは Jim が Dwight を黙らせる口実。Michael の望みは尊敬より仲間入り。',
      use: 'I just want to fit in.（ただ仲間に入りたいだけ）' },

    // why: birthday ← a b-start and a party word, the rest lost; ball game ← “b…” + “at Jim's”, a guys' night out
    { id: 'd1', skill: 'detail', level: 'B1', point: 'bbq', seg: [4, 9.6],
      stem: 'What is happening at Jim’s tonight?',
      choices: ['A barbecue', 'A birthday', 'A ball game'], a: 0,
      cue: '「e-vite」のすぐあと、Jim’s の前の語。',
      line: 'Meredith has an e-vite. *Barbecue at Jim’s tonight.*',
      said: '「メレディスに招待メールが来てる。今夜 Jim の家でバーベキュー」と話している。',
      mean: 'e-vite ＝ メールで送る招待状。今夜、Jim の家で集まりがある。',
      trap: 'barbecue は最初の「バー」が強く短い。b で始まる別の語に聞こえやすい。',
      use: 'We’re having a barbecue on Sunday.（日曜にバーベキューするよ）' },

    // R fix: V2/S1, the stem said “his own invitation”, which settled it; the distractors now are acts he could mean
    // why: doesn't care ← the flat “Tonight.” heard as a shrug (Japanese 強がり frame); checking it reached everyone ←
    //   “where is my e-vitation” heard as an admin check on Meredith's e-vite
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'evite', reveals: ['bbq'], seg: [6.2, 12.9],
      stem: 'After hearing about the barbecue, what is Michael doing with his next line?',
      choices: ['Hinting that he was left off the list', 'Showing he doesn’t care much about it',
                'Checking the e-vite reached everyone'], a: 0,
      cue: '「Tonight」をくり返したあと、ひとり言のような一文。',
      line: 'Barbecue at Jim’s tonight. — Tonight. … *Wonder where my e-vitation is.*',
      said: 'パーティーの話を聞き、「僕の招待メールはどこかな」とつぶやく。',
      mean: '本当に探しているのではなく、自分が呼ばれていないことへの遠回しなアピール。',
      trap: 'ひとり言なので強がりや確認にも聞こえる。I wonder は答えを求めず、気持ちをにじませる言い方。',
      use: 'I wonder where my invitation is.（私の招待状はどこかなあ）' },

    // R fix: V2, “spoil the party” and “don't respect him” were easy to rule out; now a busy-boss keyword trap and a
    //   strict-boss reading of “distance”. B1/N7: the key matches Jim's reason (d3), so it reveals `reason`
    // why: too busy ← “No, I'm busy right now” (3 s) kept as the reason; too strict ← “distance between a boss and the
    //   employees” heard as strictness, the spinach-dip worry lost
    { id: 'i1', skill: 'infer', level: 'B2', point: 'distance', reveals: ['reason'], seg: [12.6, 26.3],
      stem: 'In his talk to the camera, why does Michael think he isn’t invited?',
      choices: ['Staff would feel nervous around their boss', 'A boss is usually too busy for staff parties',
                'Staff think he is too strict to have fun with'], a: 0,
      cue: '「They’re thinking」のあとの、部下の心の声。',
      line: 'There’s always a *distance between a boss and the employees*. They’re thinking…',
      said: '「上司と部下には距離がある。部下は上司の目を気にするものだ」と話す。',
      mean: '呼ばれないのは、部下が緊張するからだと考えている。自分が原因だとは思っていない。',
      trap: 'distance を厳しさと取りやすいが、心の声はディップをこぼす心配。部下側の緊張の話。',
      use: 'There’s always some distance with a new boss.（新しい上司とは距離があるものだ）' },

    // why: What do I ← the flapped t in “what'll” drops and “'ll” is lost; What would I ← a d-like flap heard as
    //   “would”; What did I ← the past heard in the flap
    { id: 's1', skill: 'sound', level: 'B2', point: 'whatll', seg: [21.5, 25.4],
      stem: 'Fill the gap: “___ do if I drop spinach dip on him?”',
      choices: ['What’ll I', 'What do I', 'What would I', 'What did I'], a: 0,
      cue: '「respect him」のすぐあと、文の最初の短い音。',
      line: '*What’ll I* do if I drop spinach dip on him at a party?',
      said: '部下の心の声として「ディップをこぼしたらどうしよう」と言う。',
      mean: 'What’ll ＝ What will。t が弾んで「ワロー」に近く、’ll はほぼ「ル」だけ。',
      trap: '’ll が消えると What do I に聞こえる。弱い ’ll を待って聞く。',
      use: 'What’ll I say if she calls?（彼女から電話が来たら何て言おう）' },

    // R fix: V2/K6, “at all” sat only in a distractor and the key was the only nuanced choice; now three two-part ratings
    // why: less since boss ← “distance between a boss and the employees” just before, heard as a change over time; only
    //   to friends ← “as one of the guys” heard as a limit on whom he's approachable to
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'approach', seg: [28.2, 39.6],
      stem: 'How does Michael rate himself as “one of the guys”?',
      choices: ['Already very approachable, but could be more so', 'Less approachable since he became the boss',
                'Approachable to his friends, but not to staff'], a: 0,
      cue: '笑いのあとに続く、最後の一文。',
      line: 'I do think that I am *very approachable*… *But maybe I need to be even* approachable…',
      said: '「自分はとても話しやすい。でも、もっと話しやすくならないと」と言う。',
      mean: '欠点とは思わず、長所をさらに伸ばせばいいと考えている。',
      trap: 'distance の話から「上司で距離ができた」と取りやすいが、今も very approachable と言う。',
      use: 'Maybe I need to be even friendlier.（もっと気さくにならないとね）' },

    // R fix: V2/K3/K6, “worked hard for this moment” didn't fit a reply, and only the key lacked a clip word; the stem
    //   no longer calls Jim's line a joke
    // why: barely any time ← hardly = ほとんど〜ない, read as a time limit; already hard for him ← “hard” heard in
    //   “hardly”, tied to the slump talk just before (a plea, not a rebuke)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'hardly', seg: [84.4, 92.8],
      stem: 'What is Michael telling Jim right after the little-finger line?',
      choices: ['Now is not the time for that', 'There’s hardly any time left today', 'This is already hard enough for him'], a: 0,
      cue: '名前を呼んだあと、time の前の語。',
      line: 'Jim, this is *hardly the time*. — No, it’s completely the time.',
      said: '「今そんな時じゃない」に Jim は「今こそだ」と返す。',
      mean: 'hardly the time ＝ そんな場面ではない。軽くたしなめる言い方。',
      trap: 'hardly は hard と別の語。返事の completely the time で場面の話と分かる。',
      use: 'This is hardly the place for that.（ここでそんな話はないでしょう）' },

    // R fix: V2, the distractors were long and off the words; now a boss-frame reading and a Japanese frame (he's too
    //   sensitive)
    // why: a boss takes a joke ← the boss frame of the scene (“You are the boss”); too touchy ← “this is hardly the time”
    //   heard as Jim blaming Michael's mood, a Japanese 空気 frame
    { id: 'i2', skill: 'infer', level: 'C1', point: 'perfect', reveals: ['hardly', 'ribbing'], seg: [87.8, 100],
      stem: 'How does Jim answer Michael’s complaint about the timing?',
      choices: ['He says friendly teasing is what guys do together', 'He says a good boss can take a joke from staff',
                'He says Michael is too touchy to take a joke'], a: 0,
      cue: '「No」のあと、Jim の説明の最後の一文。',
      line: 'No, it’s completely the time… This is just *guys gently ribbing each other*. *That’s what it’s all about.*',
      said: '「今こそいい時だよ。男同士の軽いからかいさ」と返す。',
      mean: '「仲間になりたい」という Michael の望みを逆手に取り、からかいを正当化している。',
      trap: '上司と部下の話に取ると「冗談を受け流せ」に引かれるが、Jim は guys と言う。',
      use: 'That’s what friends are for.（友だちってそういうものでしょ）' },

    // R fix: V2/K3, “a serious argument” went against “gently”; now “gently” read as the meaning
    // why: poking in the ribs ← ribbing taken literally (rib = あばら骨); going easy ← “gently” heard as the whole point
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'ribbing', seg: [93, 100],
      stem: 'What does Jim say the guys are doing to each other?',
      choices: ['Teasing in a friendly way', 'Poking at each other’s ribs', 'Going easy on each other'], a: 0,
      cue: '「gently」のあとの語。each other の前。',
      line: 'This is just guys *gently ribbing* each other.',
      said: '「これは男同士の、ちょっとしたからかいだよ」と言う。',
      mean: 'rib ＝ からかう、冷やかす。gently が付いて「悪気のない」いじり。',
      trap: 'rib は「あばら骨」でもあるので、体をつつくと取りやすい。ここは言葉でのいじり。',
      use: 'Don’t worry, I’m just ribbing you.（気にしないで、からかってるだけ）' },

    // R fix: §9.5, “Are you going eat” doesn't fit the gap; “Did you wanna” replaces it
    // why: Aren't you ← the “Are you” blur can carry an n, and a complaint reading fits a boss; Do you wanna ← “gonna”
    //   heard as the more common invite form; Did you wanna ← the same vowel run, the past as a polite form
    { id: 's2', skill: 'sound', level: 'B2', point: 'eat', seg: [100.6, 104],
      stem: 'Fill the gap: “___ eat with us?”',
      choices: ['Are you gonna', 'Aren’t you gonna', 'Do you wanna', 'Did you wanna'], a: 0,
      cue: '文の最初、速くつながる3語。',
      line: '*Are you gonna* eat with us? — Of course.',
      said: '「一緒に食べる？」と聞かれ、Michael は「もちろん」と答える。',
      mean: 'Are you gonna が「アユガナ」とつながる。gonna ＝ going to。',
      trap: 'Aren’t なら「食べないの？」になる。',
      use: 'Are you gonna finish that?（それ、全部食べる？）' },

    // R fix: K3, “fix a slip in the grammar” was a filler; now a self-mocking reading (Japanese 照れ frame)
    // why: laughs at himself ← the odd add-on heard as embarrassment at the word “crew”; reminding them he's in charge ←
    //   “my crew” heard as a boss's ownership
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'crew', seg: [102.7, 111.5],
      stem: 'Why does Michael add a second line about his “crew”?',
      choices: ['To stress that he really belongs to it', 'To laugh at himself for using the word',
                'To remind them that he is the one in charge'], a: 0,
      cue: '「my crew」のすぐあと、言い足した部分。',
      line: 'Hanging with my crew. *Crew that I am one of.*',
      said: '「仲間と過ごすんだ。僕もその一人の仲間とね」とわざわざ言い足す。',
      mean: 'my crew だと上司が部下を持つように聞こえる。仲間の一人だと念を押していて、必死さが出る。',
      trap: 'my から「自分のもの」と取ると上司らしさに聞こえるが、言い足したのは逆の意味。',
      use: 'I’m one of you guys, right?（僕もみんなの仲間だよね？）' },

    // why: got lost ← the usual delivery excuse, not in the words; mixed up the order ← “order” heard, in the wrong
    //   relation
    { id: 'd4', skill: 'detail', level: 'B1', point: 'late', seg: [116.9, 121.6],
      stem: 'Why is the food delivery late?',
      choices: ['A big order came in just before', 'The driver got lost on the way', 'The shop mixed up the order'],
      a: 0,
      cue: '「so late」のあと、理由の一文。',
      line: 'Sorry this is so late. There was *a big order right before yours*.',
      said: '配達の人が「遅くなってすみません。直前に大きな注文があって」と言う。',
      mean: 'right before ＝ すぐ前に。ほかの注文が先だったという説明。',
      trap: 'order が聞こえると、注文の取りちがえを想像しやすい。理由は right before の一文。',
      use: 'Sorry I’m late. Traffic was terrible.（遅れてごめん。道がひどく混んでて）' },

    // why: free ← /θ/–/f/: “three” heard with an f, and “free” is a word in the clip; two ← a short number, the first
    //   sound lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'beer', seg: [132.4, 138.5], keep: true,
      stem: 'How many cases of beer has Jim got for the party?',
      choices: ['Two', 'Three', 'Four'], a: 1,
      cue: '「I’ve got」のすぐあと。', line: 'I’ve got *three cases* of imported beer. Karaoke machine.',
      said: 'Jim がカメラに「輸入ビールを3ケース、カラオケも用意した」と話す。',
      mean: 'case ＝ 1箱（24本ほど）。かなり本格的なパーティー。',
      trap: 'three の th は舌を軽くかむ音。free と聞こえても、数を言う場面なら three。',
      use: 'We need three cases of water.（水が3ケース要る）' },

    // R fix: V2/K6, the key was the only kind choice; now an apology reading (Japanese すみません frame) and personal =
    //   private
    // why: close friends only ← personal = 個人的, a private party; apologizing ← the softener heard as a Japanese
    //   「すみません」
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'personal', reveals: ['reason'], seg: [138.3, 146.1],
      stem: 'What is Jim doing right after saying he didn’t invite Michael?',
      choices: ['Softening the snub before giving his reason', 'Saying the party is just for close friends',
                'Apologizing to Michael for leaving him out'], a: 0,
      cue: '「didn’t invite Michael」の直後の短い一文。',
      line: 'And I didn’t invite Michael. And *it’s nothing personal*. I just think…',
      said: '「Michael は呼んでない。個人的な理由じゃない。ただ…」',
      mean: 'nothing personal ＝ 嫌いなわけではない。断りを和らげる前置き。',
      trap: '前置きは謝罪に聞こえやすいが sorry はない。I just think の理由へつなぐ。',
      use: 'It’s nothing personal. I’m just busy.（あなたのせいじゃない。忙しいだけ）' },

    // R fix: V2/K6, “always… on purpose” put an absolute in a distractor only
    // why: talks about work ← the boss frame (“affect my salary”, 26 s) and “wouldn't be able to relax”; no room ←
    //   “wants to meet everybody”, “three cases” and “karaoke machine” suggest a crowd
    { id: 'd3', skill: 'detail', level: 'B1', point: 'reason', seg: [138.3, 146.1],
      stem: 'Why didn’t Jim invite Michael?',
      choices: ['People couldn’t relax with him there', 'Michael would talk about work all night',
                'There isn’t room for everybody at his place'], a: 0,
      cue: '「if you were there」のあと。', line: 'if you were there, *people wouldn’t be able to relax*',
      said: '「あなたがいると、みんながくつろげないと思うんだ」とカメラに話す。',
      mean: '上司がいると気をつかう。わざと邪魔をするという話ではない。',
      trap: '上司なので「仕事の話」を想像しやすいが、Jim の理由は relax。周りが気をつかうこと。',
      use: 'I just want everyone to relax.（みんなにくつろいでほしいだけ）' },

    // R fix: V2/K6, “never once” was an absolute in a distractor; now curiosity (the meet-everybody wish taken alone)
    // why: curious ← “wants to meet everybody” heard as the whole point; a nickname ← “making Dwight up” heard as
    //   “making up a name”
    { id: 'h1', skill: 'humor', level: 'C1', point: 'madeup', seg: [145.4, 151.8],
      stem: 'Why does Jim’s roommate want to meet everybody, as Jim tells it?',
      choices: ['Jim’s Dwight stories sound too odd to be true', 'Jim talks about Dwight so much that he’s curious',
                'Jim calls Dwight by a funny nickname at home'], a: 0,
      cue: '「pretty sure」のあと、Dwight のあとの短い語。',
      line: 'I’m pretty sure he thinks I’m *making Dwight up*.',
      said: '「ルームメイトは、僕が Dwight を作り話だと思ってるらしい」と言う。',
      mean: 'make up ＝ でっち上げる。Dwight の話が変すぎて、実在を疑われている。',
      trap: 'make up を「名前を作る」と取るとあだ名の話になる。疑われているのは存在。',
      use: 'You’re making that up!（それ、作り話でしょ！）' },

    // R fix: K3, “put his phone away” was weak; now “slow down”, another “down” phrasal verb
    // why: write them down ← down = 書き留める, as in “write it down”; slow down ← keep … down heard as speed
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'down', seg: [153.8, 161.3],
      stem: 'What does Jim ask Dwight to do about the party directions?',
      choices: ['Talk about them more quietly', 'Write them down on paper', 'Slow down as he reads them'], a: 0,
      cue: '道順の話のあと、Jim の短い命令。',
      line: '…to get to your house for the party tonight. — *Keep that down.*',
      said: 'Dwight が大声でパーティーへの道順を話し、Jim が「声を落として」と言う。',
      mean: 'keep it down ＝ 声を小さくして。パーティーを聞かれたくない。',
      trap: 'down を「書き留める」「ゆっくり」と取りやすい。keep ～ down は音量。',
      use: 'Could you keep it down, please?（少し静かにしてもらえますか）' },

    // R fix: K5, the third choice wasn't parallel; all three now say what the party is
    // why: secret from the office ← “not everybody knows” heard as the whole party being hidden; a surprise for Dwight ←
    //   “it's a surprise” said to Dwight, so he seems the target
    { id: 'i5', skill: 'infer', level: 'C1', point: 'surprise', seg: [159.9, 174.9],
      stem: 'After Jim’s last answer, what does Dwight come to believe?',
      choices: ['The party is a surprise for Michael', 'The party is a secret from the whole office',
                'The party is a surprise for Dwight'], a: 0,
      cue: '最後の問いへの答えと、Dwight の反応。',
      line: 'Like who? — Michael. — Why just Michael? — Because *it’s a surprise*. … Oh, *that’s perfect*.',
      said: '「なぜ Michael だけ？」「サプライズだから」。Dwight は喜ぶ。',
      mean: 'Michael へのサプライズだと思いこむ。Jim は本当の理由を隠した。',
      trap: 'not everybody を全員に内緒と取りやすい。答えは Michael について。',
      use: 'Don’t tell him. It’s a surprise.（彼には言わないで。サプライズだから）' },

    // R fix: K1, Pam and Oscar don't say they have plans (“No, thanks”, “I'm on a call”), so the key now says turned
    //   down; K3, Pam's walk replaces “talks his way into Jim's party”
    // why: Dwight agrees ← “You and I are hanging tonight” heard as a done deal; Pam ← “walk you to your vehicular
    //   transport” heard, her “No, thanks” lost
    { id: 'g2', skill: 'gist', level: 'B1', point: 'evening', reveals: ['plans'], seg: [208.9, 263],
      stem: 'How does Michael’s search for company tonight go?',
      choices: ['Everyone he asks turns him down', 'Dwight agrees to watch TV with him',
                'Pam lets him walk her to her car'], a: 0,
      cue: 'Pam、Oscar、それから二人に聞いたときの返事。',
      said: 'Pam、Oscar、もう一人に今夜の予定を聞くが全員だめ。最後の Dwight も予定がある。',
      mean: '誰も Michael と夜を過ごしてくれない。',
      trap: 'hanging tonight は誘いで、約束ではない。返事まで聞く。',
      use: 'Any plans tonight?（今夜、何か予定ある？）' },

    // R fix: V2, the key was the only feeling among plans; the near miss is now right mechanism, wrong target (Dwight
    //   as the lonely one)
    // why: likes the show now ← sincerity flip on “that show you've been wanting to watch”; cheer Dwight up ← near
    //   miss: the generous offer read as kindness to Dwight, but he's the one just turned down twice
    // anchor: 222–226 s another “Okay. All right.” after a turn-down, then 228–246.9 s “my loyal compadre… the two of
    //   us… whatever stupid show you want”
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'alone', reveals: ['evening'], seg: [222, 246.9],
      stem: 'What does Michael’s offer about Dwight’s show reveal about him tonight?',
      choices: ['He badly wants someone to spend the evening with', 'He has finally come to like Dwight’s favorite show',
                'He feels sorry for Dwight and wants to cheer him up'], a: 0,
      cue: '直前に断られたことと、「whatever」で始まる一言。',
      line: 'Oh, Dwight, my *loyal compadre*. … *Whatever stupid show you want to watch, we’re watching*',
      said: '断られた直後に Dwight を「忠実な相棒」と呼び、「どんな番組でも見よう」と言う。',
      mean: '番組をばかにしつつ何でも受け入れる。一人で過ごしたくない一心。',
      trap: '気前のよさは Dwight への思いやりに見えるが、断られ続けたのは Michael。誘う側の事情を聞く。',
      use: 'Whatever you want to do, I’m in.（何をするにしても、私も乗るよ）', retired: true },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'plans', seg: [245.9, 249.5],
      stem: 'Type what Dwight says: “Unfortunately, ___.” (3 words)', answer: "i've got plans",
      cue: '「Unfortunately」のすぐあと。短い3語。',
      line: 'Unfortunately, *I’ve got plans*.',
      said: 'Michael の誘いに「あいにく予定があるんです」と断る。',
      mean: 'I’ve got ＝ I have。’ve はほとんど聞こえず「アイガッ」に近い。',
      trap: 'I got plans と書きたくなるが、弱い ’ve が入っている。意味はどちらも同じ。',
      use: 'Sorry, I’ve got plans tonight.（ごめん、今夜は予定があるの）' },

    // R fix: K3, “clarinet for his soccer team” was absurd; now an honest mix-up (the near miss to a made-up excuse)
    // why: forgot ← the switch heard as honest confusion, but he answered at once and changed only when questioned;
    //   Michael's slip ← Michael says “soccer” only because Dwight just did
    { id: 'h2', skill: 'humor', level: 'C1', point: 'clarinet', seg: [245.9, 255.3],
      stem: 'Why does Dwight’s last word about his practice get a laugh?',
      choices: ['His made-up excuse changes as he goes', 'He forgot which practice he has tonight',
                'Michael got the sport wrong, not Dwight'], a: 0,
      cue: '最初に言った練習と、最後の一語を比べて。',
      line: 'Soccer practice. — I didn’t know you played soccer, Dwight. — *Clarinet.*',
      said: '「サッカーの練習」と言い、突っこまれて「クラリネット」と答える。',
      mean: 'その場で作った言い訳なので、突っこまれると中身が変わる。うそがばれていく笑い。',
      trap: 'Michael の聞き違いに聞こえるが、soccer と言ったのは Dwight 自身。',
      use: 'I have a… dentist appointment.（えっと…歯医者の予約が）' },

    // R fix: V2/K3, “really plays clarinet” was said out loud, so nobody would take it; now “no plans at all” (the
    //   excuse is fake, the target wrong)
    // why: doesn't want to see Michael ← near miss: he's dodging, but the clip names what he hides; no plans at all ←
    //   right direction (the excuse is made up), wrong target: he has the party
    // anchor: 154–158 s Dwight asks Jim about “several different options to get to your house for the party tonight”,
    //   and 171 s he's told it's a surprise from Michael
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'clarinet', reveals: ['surprise'], seg: [245.9, 255.3],
      stem: 'When Dwight says he has practice, what is he trying not to say?',
      choices: ['That he is going to Jim’s party tonight', 'That he just doesn’t want to see Michael',
                'That he has no plans at all tonight'], a: 0,
      cue: 'Dwight が前半で聞いていたこと。',
      line: 'I have to go to *practice*. *Soccer* practice. … *Clarinet.*',
      said: '今夜は練習があると言い、サッカー、クラリネットと中身が変わる。',
      mean: '前半で Jim の家への道順を調べ、サプライズだから黙れと言われていた。本当の予定はパーティーで、言えない。',
      trap: '言い訳がうそなら「予定なし」と思いやすいが、前半で道順を聞いていた。隠し事は前半の予定と結びつける。',
      use: 'I can’t say where. It’s a secret.（どこかは言えない。秘密なんだ）', retired: true },
  ]
};
