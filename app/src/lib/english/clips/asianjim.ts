// “Asian Jim - The Office US” (the official The Office channel, BEST OF SEASON 9): a stranger sits at Jim's desk and
// insists he's Jim; Dwight tests him (yesterday's sale, the voicemail), Pam plays along, then tells the camera the truth.
// Segments from the captions, words from whisper (2026-11-16). Untested: 17–18 s (whisper “Weird joke, Dwight” vs
// captions “We're Jug Dwight”), 56 s (“How did you know?”: speaker unclear), 81–104 s (“This is Jim” rests on a desk
// photo; the rest is garbled, and whisper loops one line).
// EAR CHECK: 68.8 s a2 — “Oh, great. Can't wait.” is pleased, not sarcastic (tone; both sources agree on the words)
// EAR CHECK: 79.6 s nt2 — the stress in “you are not Jim” falls on “not” (both sources have the uncontracted “you are
//   not”; ship only once confirmed)
// REVIEW 2026-11-17: pass 9, fix 12, drop 0, new 0; ear checks 2 (unchanged)
// Open: the title gives the prank away, so g1, pr1, g2 (70 %) and nt1 (75 %, past its one C2 rewrite) stay guessable
//   from "he's an actor playing Jim". Each now has a distractor that keeps the act, so the words still decide it.
import type { Clip } from '../types.ts';

export const asianjim: Clip = {
  id: 'asianjim', video: 'xLxHtBt2jtU', title: 'Asian Jim', dur: 104, wpm: 174, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2, blind 85 % (the title tells you he plays Jim). All three choices now have him playing Jim; they differ
    //   in how it goes. It now also reveals 'briefed' (its said: he answers about the sale calmly, i2's key).
    // why: slips once ← "Or were you talking about Krieger Murphy?" heard as a guess, a crack in the act; jokes until
    //   Dwight drops it ← the early light reply ("…joke, Dwight"), and Dwight's "All right then"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'act', reveals: ['briefed'], seg: [5.6, 62.0],
      stem: 'How does the man at Jim’s desk deal with Dwight’s doubts?',
      choices: ['He passes every test, fully as Jim', 'He plays Jim but slips on one test',
                'He jokes until Dwight drops it'], a: 0,
      cue: '質問や確認に、彼がどう答え続けるか。',
      line: 'Who am I? *I’m Jim.*',
      said: '「誰だ？」と聞かれても売上の話をされても、ジムとして平然と答え続ける。',
      mean: '一度も役を降りないのが、いたずらの肝。疑うドワイトのほうが変に見える。',
      trap: '二つ目の会社名を「当てずっぽう」と取りやすい。細部まで答えたうえでの確認で、最後までジムのまま。',
      use: 'He didn’t miss a beat.（彼は少しも動じなかった）' },

    // R fix: V2, blind 70 %: "nervous" made no sense for a prank everyone knows from the title. It's now "calm, as if
    //   expecting it" (the prepared actor), which the echo question "Who am I?" refutes.
    // why: calm ← a planted actor would have the answer ready; offended ← the echo question heard as a snap
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'whoami', seg: [9.8, 15.0],
      stem: 'How does the man react when Dwight asks who he is?',
      choices: ['Surprised, as if the question were absurd', 'Calm, as if he’d expected the question',
                'Offended, as if Dwight were being rude'], a: 0,
      cue: '問い返しと、そのあとの答えの速さ。',
      line: '*Who am I?* I’m Jim.',
      said: '「誰だって？ジムだよ」と、聞かれたこと自体に驚いてみせる。',
      mean: '問い返しは「何を言ってるの？」の合図。当たり前の答えで、変なのはドワイトだと示す。',
      trap: '仕込みの役者なので、落ち着いて待っていたと取りやすい。問い返しは「何を言ってるの？」という驚きの形。',
      use: 'Who am I? I’m your neighbor!（誰って、隣の者ですよ）' },

    // why: 20 ← twelve/twenty share the "tw-"; 2 ← only the end of "twelve" caught
    { id: 'n1', skill: 'number', level: 'B1', point: 'years', seg: [11.8, 17.0],
      stem: 'How long does the man say they’ve worked together?',
      choices: ['2 years', '12 years', '20 years'], a: 1, keep: true,
      cue: 'together for のあとの数。',
      line: 'We’ve been working together for *12 years*.',
      said: '「もう12年も一緒に働いてるじゃないか」と言う。',
      mean: 'twelve ＝ 12。長い付き合いを持ち出し、疑うほうがおかしいと示す。',
      trap: 'twelve と twenty は出だしが同じ。twelve は l で終わり、twenty は -ty が付く。',
      use: 'We’ve been friends for 12 years.（もう12年来の友だちだ）' },

    // R fix: S4: segment end 25.5 → 26.0 ("race" starts at 25.0 s; the old end left no margin). Blind pass: wrong, so
    //   the choices stay.
    // why: scolds ← "race" makes it sound like a telling-off for a rude remark; admits ← "never noticed" heard as giving up
    { id: 'h1', skill: 'humor', level: 'C1', point: 'hats', seg: [18.9, 26.0],
      stem: 'Why does the man’s answer to “Jim’s not Asian” get a laugh?',
      choices: ['He praises Dwight for missing something obvious', 'He scolds Dwight for saying something rude',
                'He admits he isn’t Jim, then carries on'], a: 0,
      cue: '文頭の Hey のあとの、決まった言い回し。',
      line: 'You seriously never noticed? Hey, *hats off to you* for not seeing race.',
      said: '「本当に気づかなかったの？人種で人を見ないなんて脱帽だよ」と返す。',
      mean: '12年気づかないはずがないのに、それを立派な態度とほめる。そのずれが笑い。',
      trap: 'race の話題なので、たしなめていると取りやすい。hats off to you はほめる言い方。',
      use: 'Hats off to you for finishing that.（やり遂げたなんて脱帽だよ）' },

    // R fix: V2 + K6, blind 60 %: "for now" made the key the only hedged choice. All three are hedged now.
    // why: believes it ← he calls the man "Jim"; dropping it ← "all right" heard as conceding the argument
    { id: 'm1', skill: 'marker', level: 'B2', point: 'allright', reveals: ['test'], seg: [28.1, 33.3],
      stem: 'What does Dwight’s reply signal before he asks about the sale?',
      choices: ['He’ll go along with it, for now', 'He believes it, at least for now', 'He’s dropping it, at least for today'],
      a: 0,
      cue: 'Jim と呼ぶ前の、短い2語。',
      line: '*All right, then*, Jim.',
      said: '「じゃあいいだろう、ジム」と、いったん呼び方を合わせる。',
      mean: 'All right, then は「それなら、ひとまず」。納得ではなく、乗るふりの前置き。',
      trap: 'Jim と呼ぶので信じたと取りやすい。直後に試す質問が来る流れを聞く。',
      use: 'All right, then. Show me.（じゃあいいよ、見せて）' },

    // R fix: V2, blind 85 %: "asking for help with his own sale" was weak. It's now "checking a sale Jim didn't log"
    //   (office business), which the open "tell me about that sale" refutes: it asks for the story, not a record.
    // why: small talk ← "why don't you tell me" is a friendly suggestion form; checking a log ← "that sale that you
    //   made yesterday" heard as routine paperwork
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'test', seg: [28.1, 33.3],
      stem: 'What is Dwight doing when he asks about yesterday’s sale?',
      choices: ['Testing what he knows about Jim’s work', 'Changing the subject to calm things down',
                'Checking on a sale that Jim didn’t log'], a: 0,
      cue: 'why don’t you のあと、何を聞くか。',
      line: 'why don’t you *tell me about that sale* that you made yesterday?',
      said: '「じゃあ昨日決めた売上の話をしてくれよ」と持ちかける。',
      mean: '形は気軽な誘いだが、本物しか答えられない質問で正体を試している。',
      trap: 'why don’t you は提案の形なので雑談と取りやすい。聞く中身が本人確認か見る。',
      use: 'Why don’t you tell me about your trip?（旅行の話を聞かせてよ）' },

    // why: 24 ← the number right after, in "24-pound"; 4 ← the "-ty"-less end of "24" or a misheard "ten"
    { id: 'n2', skill: 'number', level: 'B1', point: 'cases', seg: [33.8, 38.7],
      stem: 'How many cases did Wellington Systems buy?',
      choices: ['4', '10', '24'], a: 1, keep: true,
      cue: 'sold them のすぐあとの数。',
      line: 'Wellington Systems sold them *10 cases* of 24-pound letter stock.',
      said: '「ウェリントン・システムズに、24ポンドの用紙を10箱」と答える。',
      mean: 'case ＝ 箱。24-pound は紙の厚さの規格で、数量ではない。',
      trap: 'すぐあとの 24 を数量と取りやすい。cases の直前の数が箱の数。',
      use: 'We need ten cases of water.（水を10ケースください）' },

    // R fix: V2, blind 75 %: "badly" and "vaguely" don't fit a prank the title gives away. Now "shakily: he has to
    //   guess at the client" competes with the key: the second company name heard as a guess.
    // why: guessing ← "Or were you talking about Krieger Murphy?" heard as unsure which sale; steering away ← the answer
    //   ends on a voicemail
    { id: 'i2', skill: 'infer', level: 'B2', point: 'briefed', reveals: ['cases', 'voicemail'], seg: [33.8, 45.5],
      stem: 'How well does the man handle the question about the sale?',
      choices: ['Smoothly: exact details, then a follow-up', 'Shakily: he has to guess at the client',
                'Vaguely: he steers it to the voicemail'], a: 0,
      cue: '数や紙の種類の細かさと、もう一件の話。',
      line: '…letter stock. *Or were you talking about* Krieger Murphy?',
      said: '売った数や紙の種類まで答え、「それとも、まだの方の件？」と聞き返す。',
      mean: '本物しか知らない細部まで答え、逆に聞き返している。準備は完ぺき。',
      trap: '会社名が二つ出るので混乱と取りやすいが、どちらの件か確かめているだけ。',
      use: 'Or were you talking about the other one?（それとも、もう一つの方の話？）' },

    // why: haven't closed ← the textbook pairing with "yet"; couldn't ← the same weak "-dn't" with a different verb
    { id: 's1', skill: 'sound', level: 'B2', point: 'close', seg: [38.3, 42.0],
      stem: 'Fill the gap: “Because I ___ that one yet.”',
      choices: ['didn’t close', 'couldn’t close', 'haven’t closed'], a: 0,
      cue: 'Because I のあと、短く弱い2語。',
      line: 'Because I *didn’t close* that one yet.',
      said: '「その件はまだ決まってないから」と言う。',
      mean: 'close ＝ 契約を決める。米語では yet と didn’t をよく組み合わせる。',
      trap: '習った文法で haven’t を待ちやすい。didn’t は弱く「ディドゥン」に近い。',
      use: 'I didn’t finish it yet.（まだ終わってないんだ）' },

    // why: call back ← "phone" caught without "voice"; email ← "-mail" caught without "voice"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'voicemail', seg: [41.4, 45.5],
      stem: 'What is the man hoping for from Paul?',
      choices: ['A voicemail from the client', 'A call back from the client', 'An email from the client'], a: 0,
      cue: 'hoping のあと、got a に続く語。',
      line: 'I’m hoping I’ve got a *voicemail* from Paul Krieger…',
      said: '「クリーガーさんから留守電が入ってるといいな」と言う。',
      mean: 'voicemail ＝ 留守番電話の伝言。このあと本当に1件入っている。',
      trap: 'mail だけ拾うとメールと取りやすい。voice ＋ mail で、声の伝言。',
      use: 'Did you get my voicemail?（留守電、聞いてくれた？）' },

    // why: meant for him ← "sensitive information" heard as Dwight's private business; set up ← the message came
    //   right on cue
    { id: 'i3', skill: 'infer', level: 'C1', point: 'outsider', reveals: ['voicemail'], seg: [53.8, 61.9],
      stem: 'When the message plays, what does Dwight’s reason for stopping it show?',
      choices: ['No proof will make him accept the man', 'He thinks the message is meant for him',
                'He suspects the message was set up'], a: 0,
      cue: 'employees と outsiders の対比。',
      line: 'That is sensitive information *only for employees, not outsiders*.',
      said: '伝言が1件入っていても、「社員だけの情報だ、部外者はダメ」と止める。',
      mean: '合っていても「部外者だから」と線を引く。何を見せても認めない姿勢。',
      trap: '中身を怪しんでいると取りやすい。理由として言うのは、相手の立場だけ。',
      use: 'Sorry, staff only beyond this point.（ここから先は関係者のみです）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'cutout', seg: [61.7, 64.0],
      stem: 'Type what he says: “Dwight, ___. I’m trying to work.” (3 words)', answer: 'cut it out',
      cue: 'Dwight と呼んだすぐあと、つながる3語。',
      line: 'Dwight, *cut it out*. I’m trying to work.',
      said: '「ドワイト、やめてくれ。仕事中なんだ」と言う。',
      mean: 'cut it out が「カディダウ」のようにつながる。t が弾んで d に近い。',
      trap: '3語がひとつに聞こえ、切れ目を探しにくい。弾む t は「ラ」「ダ」に近い。',
      use: 'Cut it out, I’m on the phone.（やめて、電話中なんだ）' },

    // R fix: V2, blind 50 %: "cut the call short" didn't fit (there was no call). It's now "cut the message off" (the
    //   voicemail Dwight just stopped), "cut" read literally.
    // why: cut the message ← "cut" read literally, and a message was just playing; clear out ← "out" caught alone
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'cutout', seg: [61.7, 64.9],
      stem: 'What does the man tell Dwight to do?',
      choices: ['Stop bothering him', 'Cut the message off', 'Clear out of the office'], a: 0,
      cue: 'Dwight と呼んだあとの、短い命令。',
      line: 'Dwight, *cut it out*. I’m trying to work.',
      said: '呼びかけてから短く命じ、「仕事中なんだ」と続ける。',
      mean: 'cut it out ＝ そういうことはやめろ。cut ＝ 切る、ではない。',
      trap: 'cut や out だけ拾うと「切る」「出ていけ」と取りやすい。3語でひとつの命令。',
      use: 'Okay, cut it out, you two.（はいはい、二人ともやめなさい）' },

    // why: admits ← "You don't work" heard as "you can't work (because of me)"; elsewhere ← "here" heard as "not here"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'workhere', seg: [61.7, 65.7],
      stem: 'Why does Dwight’s comeback to “I’m trying to work” get a laugh?',
      choices: ['He takes “work” to mean “have a job here”', 'He admits he’s the one stopping the work',
                'He tells the man to go work somewhere else'], a: 0,
      cue: '返事の中で、work をどう使っているか。',
      line: 'I’m trying to *work*. — You don’t *work here*.',
      said: '「仕事中なんだ」に「お前はここで働いてない」と返す。',
      mean: '相手の「仕事をする」を「ここの社員だ」にすり替え、部外者だと言い張る。',
      trap: '邪魔をやめろの流れなので「よそでやれ」と取りやすい。要は here。',
      use: 'You don’t even work here!（あなた、ここの人じゃないでしょ）' },

    // R fix: V2, blind 60 %: "finally accepts" was too far off. It's now "gives up, still doubting" (outnumbered once
    //   Pam calls the man "Jim"), which his last line refutes.
    // why: gives up ← Pam calls the man "Jim", so Dwight seems outnumbered; worked out ← Pam's comment to camera heard
    //   as said to Dwight
    { id: 'g2', skill: 'gist', level: 'B2', point: 'notjim', seg: [62.0, 81.0],
      stem: 'By the end of the clip, where does Dwight stand?',
      choices: ['He still won’t accept that the man is Jim', 'He gives up, though he still has doubts',
                'He’s worked out that Pam set it all up'], a: 0,
      cue: '最後の Dwight の一文、but のあと。',
      line: 'I don’t know who you are, but *you are not Jim*.',
      said: '何を見せられても「誰だか知らないが、お前はジムじゃない」と言い張る。',
      mean: 'いたずらの仕掛けはどれも効かず、ドワイトは最初の主張を曲げない。',
      trap: 'パムの種明かしでドワイトも気づいたと取りやすい。あれはカメラへの話。',
      use: 'Sorry, I just don’t buy it.（悪いけど、信じられない）' },

    // why: 7:00 ← "thirty" lost after the restaurant name; 8:30 ← "thirty" caught, the hour missed
    { id: 'n3', skill: 'number', level: 'B1', point: 'dinner', seg: [65.3, 68.8],
      stem: 'What time is the dinner reservation?',
      choices: ['7:00', '7:30', '8:30'], a: 1, keep: true,
      cue: 'レストラン名のあとの時刻。',
      line: 'I got us that dinner reservation. … *7:30*.',
      said: '「夕食の予約が取れたよ。7時半」と伝える。',
      mean: 'seven thirty ＝ 7時半。時刻は数を二つ並べて言う。',
      trap: '店の名前に気を取られて、後ろの thirty を落としやすい。時刻は二つめの数まで。',
      use: 'Table for two at seven thirty?（7時半に2名で）' },

    // R fix: V2, blind 70 %: "sarcastic, dreading it" broke the act everyone expects. It's now "dryly, teasing her,
    //   husband-style", which keeps the act. The difference is tone, so it stays on the ear-check list.
    // why: teasing ← "Oh, great" is a common dry reply, and a husband teasing about a dinner stays in role; puzzled ← the
    //   man isn't really Jim, so it should be news
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'cantwait', seg: [65.3, 70.0],
      stem: 'How does the man answer the news about dinner?',
      choices: ['Warmly: he’s looking forward to it', 'Dryly: he’s teasing her, husband-style',
                'Vaguely: he isn’t sure what she means'], a: 0,
      cue: 'Oh, great のあとの短いひと言。',
      line: 'Oh, great. *Can’t wait.*',
      said: '「いいね、楽しみ」と短く答える。',
      mean: 'Can’t wait. ＝ 待ちきれない、楽しみ。ジムとして素直に喜ぶ演技。',
      trap: 'Oh, great は乾いたからかいにも使うので、冗談と取りやすい。続く Can’t wait の明るさで決める。',
      use: 'Dinner Friday? Can’t wait!（金曜に夕食？楽しみ！）' },

    // C2: the talking head against the scene
    // R fix: V2 + the C2 rewrite, blind 85 %: once you know it's a prank, "an act" was the only reading left. Now two
    //   choices are acts, differing in whose prank it is (right mechanism, wrong target); "of ours" settles it.
    // why: helping Dwight ← she's the one bringing news to "Jim" while Dwight is testing him, so she sounds like
    //   Dwight's helper; slip ← "Jim's at the dentist" heard as Pam forgetting where Jim was
    // anchor: 73.7–77.1 s "Jim's at the dentist… Steve is an actor friend of ours": she knows exactly who the man is,
    //   and "ours" puts her with Jim, so "Jim, I got us that dinner reservation" (65.8 s) is part of their prank
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'plan', reveals: ['steve', 'dentist'], seg: [65.3, 77.6],
      stem: 'After Pam’s comment to the camera, how should we hear her dinner line?',
      choices: ['An act: she and Jim set up the prank', 'An act: she’s helping Dwight test the man',
                'A slip: she forgot Jim was out today'], a: 0,
      cue: '夕食の話と、カメラへの一言を比べて。',
      line: 'Jim, I got us that dinner reservation. … Steve is *an actor friend of ours*.',
      said: '彼をジムと呼んで夕食の予約を伝え、あとでカメラに「スティーブは友だちの俳優」と話す。',
      mean: 'カメラへの一言が場面を書きかえる。of ours でパムも仕掛け人と分かり、夕食の話も芝居になる。',
      trap: '芝居と分かっても、誰の側かを取りちがえやすい。of ours の「私たち」が仕掛けた側。',
      use: 'She was in on it the whole time.（彼女、最初からグルだった）', retired: true },

    // why: doctor's ← a medical word caught without its end; sales call ← the office talk all scene long
    { id: 'd3', skill: 'detail', level: 'B1', point: 'dentist', reveals: ['plan'], seg: [73.2, 77.6],
      stem: 'Where is the real Jim this morning, according to Pam?',
      choices: ['At the dentist', 'At the doctor’s', 'At a sales call'], a: 0,
      cue: 'Jim’s at のあと、場所の一語。',
      line: '*Jim’s at the dentist* this morning.',
      said: '「ジムは今朝、歯医者に行ってる」とカメラに話す。',
      mean: '本物のジムは不在。その間に別人を座らせたと分かる。',
      trap: 'dentist の t は弱く「デニスト」に近い。医者系の語だけ拾うと doctor と迷う。',
      use: 'I have a dentist appointment at ten.（10時に歯医者の予約がある）' },

    // R fix: V2, blind 60 %: "cousin" and "new salesman" were easy to set aside. Now "an old school friend of Jim's"
    //   (the "friend of ours" keyword) competes with the key.
    // why: salesman ← he sits at a sales desk and talks sales; school friend ← "friend of ours" caught, "actor" lost
    //   to its flapped t
    { id: 'd4', skill: 'detail', level: 'B1', point: 'steve', reveals: ['plan'], seg: [73.2, 77.6],
      stem: 'Who is Steve, according to Pam?',
      choices: ['An actor friend of theirs', 'An old school friend of Jim’s', 'A salesman from another branch'], a: 0,
      cue: 'Steve is のあと、二つの名詞。',
      line: 'And *Steve is an actor friend* of ours.',
      said: '「スティーブは私たちの友だちの俳優」と明かす。',
      mean: 'actor friend ＝ 俳優の友人。of ours で、ジムとパムが仕組んだと分かる。',
      trap: 'actor の t は弾んで聞きにくく、friend だけ残りやすい。前の語まで聞く。',
      use: 'She’s a musician friend of mine.（ミュージシャンの友だちなんだ）' },

    // C2: stress that changes the meaning
    // R fix: V2 + K6, blind 50 %: "said in full" in the key echoed the stem's uncontracted "you are not", a cue only the
    //   key had. Cut.
    // why: on "you" ← "I don't know who you are, but you…" sounds like a you/I contrast; on "Jim" ← heard as setting
    //   "Jim" against the man's real name
    // anchor: 64.8 s he says "You're not Jim", contracted; at 79.8–80.5 s both sources have the full "you are not":
    //   undoing the contraction puts the weight on "not"
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'notjim', seg: [77.3, 81.0],
      stem: 'Where is the stress in “you are not Jim,” and why?',
      choices: ['On “not”: a flat, total denial', 'On “you”: a contrast with someone else',
                'On “Jim”: a contrast with another name'], a: 0,
      cue: '前の言い方と比べ、縮めずに言った所。',
      line: 'I don’t know who you are, but you are *not* Jim.',
      said: '「誰だか知らないが、お前はジムじゃない」。前は You’re と縮めたのに、ここは are not と分けて言う。',
      mean: '縮めずに言うと not が強く立ち、「絶対に違う」という断言になる。',
      trap: 'but の後は対比と思い、you を強めたくなる。縮約をほどいた所が強調の目印。',
      use: 'I am not going. Final answer.（行かない。これが最終回答）', retired: true },
  ]
};
