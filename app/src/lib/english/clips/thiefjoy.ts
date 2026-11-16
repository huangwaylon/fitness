// “You are a thief of joy | Season 5 Deleted Scene | Superfan - The Office US” (the official The Office channel,
// BEST OF SEASON 5): Holly runs an ethics seminar and asks the staff to own up to things, with no punishment; the
// confessions grow from long lunches to a supplier deal, and Michael ends the meeting the moment it turns serious.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈218 s (whisper loops one line from 228 s).
// Untested: 97–103 s (the INS report: world knowledge), 132–171 s apart from the discounts (Meredith's deal is sexual;
// 163–168 s is garbled in both), 145 s (“Jackpot”: speaker unknown), 130 s (“Wait.”: whose car is unclear).
// EAR CHECK: 55.7 s i1 — “You are a thief of joy” is taken as said *to* Dwight (whisper starts a new speaker after
//   “Never.”; the captions run on); the sickness list after it (58–71 s, t2 s1 nt1) is taken as Dwight's
// EAR CHECK: 216.6 s nt2 — “What you gonna do?” is taken as Michael's shrug (after Holly's “Michael, …” and his
//   “Yeah.”), not a real question to Holly
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 2
import type { Clip } from '../types.ts';

export const thiefOfJoy: Clip = {
  id: 'thiefjoy', video: '3NxkwesgimM', title: 'You are a thief of joy | Season 5 Deleted Scene | Superfan - The Office US',
  dur: 242, wpm: 146, band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %: the key was the only "safe" choice) — three parallel "Share … , with/in/without …"
    //   choices; S4 gist seg was 12.5 s, now runs to "I will go first" (15.6 s)
    // why: current worries ← "faced any ethical dilemmas" heard as a request for advice on today's problems;
    //   others' slips ← "say something" about the workplace heard as telling on coworkers
    { id: 'g1', skill: 'gist', level: 'B1', point: 'purpose', seg: [0, 15.6],
      stem: 'What is Holly asking the staff to do?',
      choices: ['Share their own slips, with no punishment', 'Share their current worries, in confidence',
                'Share coworkers’ slips, without naming names'], a: 0,
      cue: '最後の「without any」のあとの約束。',
      line: 'This is a chance for you to say something *without any repercussions*.',
      said: '仕事で倫理的に迷ったことはあるか、罰なしで話せる機会だ、と呼びかける。',
      mean: 'repercussions ＝ 悪い結果・処分。責めないから話して、という前置き。',
      trap: 'dilemmas から今の悩み相談に思えるが、聞いているのは過去にしたこと。',
      use: 'You can say it without any repercussions.（何を言っても大丈夫だよ）' },

    // why: fifteen/fifty ← -teen/-ty near sounds; four ← "for" right before "five days" ("work for five days")
    { id: 'n1', skill: 'number', level: 'B1', point: 'days', seg: [15.2, 21], keep: true,
      stem: 'After discovering YouTube, how long did he stop working?',
      choices: ['Four days', 'Five days', 'Fifteen days', 'Fifty days'], a: 1,
      cue: '「I didn’t work」のあと、for に続く数。',
      line: 'When I discovered YouTube, I didn’t work for *five days*.',
      said: 'YouTube を見つけたとき、5日間まったく仕事をしなかったと言う。',
      mean: '最初の告白。何もしなかった期間。',
      trap: 'for five が続いて four と迷いやすい。-teen や -ty の語尾がないかも聞く。',
      use: 'I didn’t check email for three days.（3日間メールを見なかった）' },

    // why: a hundred ← "about a" then a quick number word; ten thousand ← "thousand" heard with a lost "ten" in front
    { id: 'n2', skill: 'number', level: 'B1', point: 'times', seg: [21, 26], keep: true,
      stem: 'About how many times did he watch the one video?',
      choices: ['About a hundred', 'About three hundred', 'About a thousand', 'About ten thousand'], a: 2,
      cue: '曲の名前のあと、about に続く数。',
      line: 'I viewed “Cookie Monster sings Chocolate Rain” *about 1,000 times*.',
      said: '同じ動画を約1,000回見たと言う。',
      mean: '5日間の中身は、この一本の動画。',
      trap: 'about a のあとが速く、hundred と迷いやすい。th の「サ」と最後の -sand を聞く。',
      use: 'I’ve seen that movie about a hundred times.（あの映画は百回くらい見た）' },

    // R fix: V2 (blind 65 %) and the cue leak on "dilemma" (only the key had it) — a second "His only dilemma…"
    //   choice
    // why: not wrong ← "I feel very, very good" heard as "watching videos is fine"; whether to stop ← the dilemma
    //   a listener expects (to keep slacking or not), with "or not" caught but "tell" missed
    { id: 'h1', skill: 'humor', level: 'C1', point: 'dilemma', seg: [25.6, 33.9],
      stem: 'When Holly asks what the dilemma was, why is his answer funny?',
      choices: ['His only dilemma was whether to tell, not the slacking', 'He says the slacking was never really wrong at all',
                'His only dilemma was whether to stop, and he didn’t'], a: 0,
      cue: '「What was the dilemma?」の直後の答え。',
      line: '*To tell you or not*, and I’m glad I did.',
      said: '何に迷ったかと聞かれ、「言うかどうか。言ってよかった」と答える。',
      mean: '迷うべきは「さぼるか」なのに、彼の迷いは告白するかだけ。そのずれが笑い。',
      trap: 'feel very good を「動画は悪くない」と取りやすい。よかったのは話したこと。',
      use: 'I’m so glad I told you.（話してよかった）' },

    // why: I'm glad I'd do it ← the weak "did" heard as a contraction; I'm glad it is ← "I did" heard as "it is"
    { id: 'x1', skill: 'dict', level: 'B1', point: 'glad', reveals: ['dilemma'], seg: [28, 32.4],
      stem: 'Type what he says after “To tell you or not”: “and ___.” (4 words)', answer: "i'm glad i did",
      cue: '「To tell you or not」のあと。短い語が4つ続く。',
      line: 'To tell you or not, and *I’m glad I did*.',
      said: '「言うか迷ったけど、言ってよかった」と付け足す。',
      mean: 'I’m glad I did ＝ やってよかった。did は前の動詞（tell）の代わり。',
      trap: 'glad‿I‿did がつながり「グラダイディッ」に聞こえる。最後の d は弱く、ほぼ止まるだけ。',
      use: 'I almost didn’t, but I’m glad I did.（迷ったけど、やってよかった）' },

    // R fix: V2 (blind 50 %, right) — both distractors are now confidentiality promises, the usual near miss for
    //   "immunity"
    // why: names not shared ← a common promise in workplace surveys; won't leave the room ← the usual "safe space"
    //   promise in a session like this
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'immunity', reveals: ['purpose'], seg: [34, 41.2],
      stem: 'After the first confession, what are the staff promised if they speak?',
      choices: ['They won’t be punished for what they say', 'Their names won’t be shared with anyone',
                'Nothing they say here will leave the room'], a: 0,
      cue: '「you can say anything」のあとの二語。',
      line: 'You can say anything you want with *total and complete immunity*.',
      said: '「何を言っても処分はない。完全に免責だ」と重ねて約束する。',
      mean: 'immunity ＝ ここでは「罪に問われないこと」。医学の免疫ではなく、法律寄りの意味。',
      trap: '匿名の約束と混ざりやすいが、名前を隠すとは言っていない。immunity は罰がないこと。',
      use: 'Don’t worry, you won’t get in trouble.（心配しないで、怒られないから）' },

    // why: a nap ← "siesta" is said right after, but by someone else as a joke; leaving early ← a common "time" sin
    { id: 'd1', skill: 'detail', level: 'B1', point: 'lunch', seg: [44.85, 48.1],
      stem: 'What is the first confession from the staff?',
      choices: ['Taking a long lunch now and then', 'Taking a short nap at the desk',
                'Leaving work early now and then'], a: 0,
      cue: '「Once in a while」のあと。',
      line: 'Once in a while, I’ll take *a long lunch*.',
      said: '「ときどき長めの昼休みを取る」と告白する。',
      mean: 'once in a while ＝ ときどき。とても小さな告白。',
      trap: '直後に siesta（昼寝）と言われるので昼寝を選びやすいが、それは周りの冗談。本人の言葉を聞く。',
      use: 'Once in a while, I work from home.（ときどき家で仕事をする）' },

    // R fix: S1/K1 — the stem named "the long lunch" (d1's key) and "the next voice" is the "A siesta." voice
    //   (whisper splits them); it now points past "A siesta"
    // why: jokes along ← "a siesta" just before is a joke, so "thief" sounds playful; does it too ← "time" heard as
    //   "me too"
    { id: 't1', skill: 'attitude', level: 'B1', point: 'thief', seg: [47.7, 50.9],
      stem: 'After “A siesta”, how does the next voice react to the confession?',
      choices: ['Calls for him to be fired', 'Jokes that a nap sounds nice', 'Admits to doing it too'], a: 0,
      cue: '同じ語のくり返しと、最後の短い命令。',
      line: '*Time thief*. Time thief, *fire him*.',
      said: '「時間泥棒。時間泥棒だ、クビにしろ」と言う。',
      mean: '罰なしの場なのに、すぐ処分を求める。ちょっとした告白にも厳しい反応。',
      trap: '直前の「シエスタ」が冗談なので軽く聞こえやすい。fire him は「クビにしろ」で、命令の形。',
      use: 'Come on, don’t be so hard on him.（まあまあ、そんなに責めないで）' },

    // R fix: V2 (blind 80 %: the title gives "joy", and only the key had a fun/joy word) — a scope-shift
    //   distractor (his own fun) now shares it
    // why: his own fun ← "thief of joy" heard as "someone with no joy", a stiff man who robs himself;
    //   time as well ← "thief" heard as the same "time thief" charge
    { id: 'i1', skill: 'infer', level: 'C1', point: 'joy', reveals: ['thief'], seg: [50.45, 57.7],
      stem: 'When Dwight says he never steals company time, what is the reply’s point?',
      choices: ['He spoils the fun for everyone else', 'He never lets himself have any fun',
                'He must be stealing company time as well'], a: 0,
      cue: '直前の「time thief」と、言いかえた語。',
      line: '*Never.* — You are *a thief of joy*.',
      said: '時間を盗んだことは「一度もない」と言うドワイトに、「君は喜びの泥棒だ」と返す。',
      mean: '彼の「時間泥棒」を逆手に取り、場をしらけさせる人だと言っている。',
      trap: 'thief から「時間も盗んでいる」と取りやすい。of のあとで盗む物が変わる。',
      use: 'Don’t be such a buzzkill.（しらけさせないでよ）' },

    // R fix: V2 (blind 80 %: the key was the only positive reading) — three parallel "As a … that …" choices
    // why: confession ← it comes in a confession session, and the illnesses are catching; complaint ← a list of
    //   illnesses heard as "they make me work sick"
    { id: 't2', skill: 'attitude', level: 'B2', point: 'sick', reveals: ['comein'], seg: [57.7, 71.9],
      stem: 'How does Dwight mean his list of illnesses?',
      choices: ['As a boast that nothing keeps him home', 'As a confession that he worked while contagious',
                'As a complaint that he can never stay home'], a: 0,
      cue: '最初の「never missed」と、最後の短い一文。',
      line: 'I have *never missed a day* because of sickness… *I still come in*.',
      said: '「病気で休んだことは一度もない。胃腸炎、シラミ、水ぼうそうでも出社する」と並べる。',
      mean: '自慢として言っている。つらそうではなく、むしろ誇らしげ。',
      trap: '告白の場なので罪の告白に思えるが、本人は胸を張っている。never で始まる文は自慢の形になりやすい。',
      use: 'I haven’t missed a day all year.（今年は一日も休んでない）' },

    // C2: who is the joke on? (cf. t2)
    // anchor: 58.4–72 s every clause is "I": "I have never missed a day… I have had intestinal flu, scabies, lice,
    //   pink eye, mono, the pox. I still come in."
    // R fix: V2/K6 (blind 65 %: the key was the only choice with a reason clause) — three parallel "X, who …"
    // why: the long-luncher ← it follows the "time thief" charge, so it sounds aimed at him; the sick ← "missed a day
    //   because of sickness" heard as a dig at people who take sick days
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'sick', reveals: ['comein'], seg: [57.7, 71.9],
      stem: 'In Dwight’s speech about never missing a day, who is the joke on?',
      choices: ['Dwight, who brags about bringing lice to work', 'The long-luncher, who looks lazy beside him',
                'Sick-day takers, who look weak beside him'], a: 0,
      cue: '並ぶ病名の中身と、最後の一文の主語。',
      line: 'I have had intestinal flu, scabies, lice, pink eye, mono, the pox. *I still come in*.',
      said: 'うつる病気を次々と挙げ、「それでも出社する」と胸を張る。主語はずっと I。',
      mean: '本人は勤勉の自慢のつもりだが、シラミでも出社して周りにうつしていると認めている。笑われているのは話し手。',
      trap: '直前の「時間泥棒」への当てこすりに聞こえやすい。主語と病名の中身を聞けば、ずっと自分の話。',
      use: 'I never call in sick. Not even once.（病欠は一度もない）' },

    // why: came ← past tense expected after a list of past illnesses; 'll ← the weak "still" heard as a contraction;
    //   'd ← "I'd still come in" as a hypothetical
    { id: 's1', skill: 'sound', level: 'B2', point: 'comein', seg: [68.6, 71.9],
      stem: 'Fill the gap: “I ___ in.”',
      choices: ['still come', 'still came', 'll still come', 'd still come'], a: 0,
      cue: '病名の最後のあと。動詞の母音を聞く。',
      line: 'the pox. *I still come in*.',
      said: '病名を並べたあと「それでも出社する」と言い切る。',
      mean: '現在形の come で「いつもそうしている」という習慣。過去の一回ではない。',
      trap: '前が過去の病気なので came を予想しやすい。come は「カム」、came は「ケイム」。母音で決める。',
      use: 'Even when it rains, I still walk.（雨でも歩いて行く）' },

    // R fix: V2 (blind 85 %) — "Who wasn't?" didn't fit after "I download"; "Who doesn't?" (the same shrug, and a
    //   better fit for the present tense) replaces it
    // why: Who has? ← the final -n't is lost, and it flips the meaning ("nobody does that"); Who doesn't? ← the
    //   same shrug, and the tense a listener expects after "Sometimes I download"
    { id: 's2', skill: 'sound', level: 'B2', point: 'whohasnt', seg: [72.55, 78.3],
      stem: 'Right after the pirated music confession, what is the two-word reply?',
      choices: ['Who has?', 'Who hasn’t?', 'Who doesn’t?'], a: 1,
      cue: '告白の直後、短い二語。最後の音に注意。',
      line: 'Sometimes I download pirated music… — *Who hasn’t?*',
      said: '「会社のパソコンに違法な音楽を入れる」に、「やってない人いる？」と返す。',
      mean: 'Who hasn’t? ＝ みんなやってる。小さな告白として流している。',
      trap: 'Who doesn’t? も同じ意味。母音の「ハ」と「ダ」で分ける。has なら逆の意味。',
      use: 'Who hasn’t done that?（それ、誰でもやるでしょ）' },

    // R fix: V2 (blind 75 %: the key was the only naughty choice in a confession session) — all three are now
    //   ways of dodging the brunch
    // why: leave early ← "couldn't make it" half-heard as "couldn't stay"; arrive late ← "make it" heard as "make it
    //   on time"
    { id: 'd2', skill: 'detail', level: 'B2', point: 'brunch', seg: [80.6, 88.6],
      stem: 'What did several people do about Andy’s engagement brunch?',
      choices: ['Worked out excuses together to skip it', 'Agreed together to leave it early',
                'Planned together to show up late to it'], a: 0,
      cue: '「come up with」のあと、why に続く部分。',
      line: 'several of us got together to *come up with excuses why we couldn’t make it*.',
      said: '「何人かで集まって、行けない言い訳を考えた」と告白する。',
      mean: 'make it ＝ 行ける・間に合う。みんなでわざと欠席した、という告白。',
      trap: 'make it には「間に合う」もあるので遅刻に思えやすい。couldn’t make it は「行けない」。',
      use: 'Sorry, I can’t make it tonight.（ごめん、今夜は行けない）' },

    // R fix: V2 (blind 70 %) — "never heard about it" was weak; "no one came" heard as "no one came forward" now
    //   stands in
    // why: no one else will own up ← "no one came" heard as "no one came forward"; called off ← "no one came" heard
    //   as the brunch not happening
    { id: 'i4', skill: 'infer', level: 'C1', point: 'noone', reveals: ['brunch'], seg: [88.9, 94.5],
      stem: 'When Phyllis won’t give names, what does the reply suggest?',
      choices: ['Everyone invited took part in it', 'No one else will own up to it',
                'The brunch was called off that day'], a: 0,
      cue: '「I don’t want to say」の直後、Yeah で始まる返事。',
      line: 'I don’t want to say. — Yeah, ’cause *no one came*.',
      said: 'フィリスが「言いたくない」と言うと、「そりゃそうだ、誰も来なかったんだから」と返される。',
      mean: '名前を挙げられないのは、全員が言い訳組だったから。',
      trap: 'no one came を「中止になった」と取りやすい。開いたのに誰も来なかった、という意味。',
      use: 'Nobody showed up to the party.（パーティーに誰も来なかった）' },

    // R fix: V2 (blind 50 %, right: the only "turns out" twist) — three parallel "A … is …" choices; the
    //   distractors keep the war-crime and army-unit misreadings
    // why: real crime ← "atrocities in Vietnam" without the end; army unit ← "Princess Cruise Lines" heard as a
    //   military name
    { id: 'h2', skill: 'humor', level: 'C1', point: 'vietnam', seg: [104.2, 115.3],
      stem: 'Why does the confession about Vietnam get a laugh?',
      choices: ['A war-crime opening shrinks to a recent cruise', 'A real war crime is confessed far too calmly',
                'A cruise line is named as if it were his army unit'], a: 0,
      cue: '「Vietnam」のあと、いつのことか、どこでか。',
      line: 'Committed some *atrocities in Vietnam*, uh, *two years ago*. Princess Cruise Lines.',
      said: '「ベトナムで残虐行為をした。2年前、クルーズ船で」と言う。',
      mean: '戦争の話かと思わせて、最近の船旅だと分かる。その落差が笑い。',
      trap: '前半だけだと深刻な告白に聞こえる。two years ago と船会社の名前で、話の大きさが変わる。',
      use: 'I did some things on that trip.（あの旅ではいろいろやらかした）' },

    // why: long hours ← "really hard" heard about work; friendly teasing ← "riding" heard as playful
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'riding', seg: [119.8, 124.3],
      stem: 'What does Ryan say people did to him over the website last year?',
      choices: ['Criticized and pushed him a lot', 'Made him work long hours on it', 'Teased him about it, just for fun'],
      a: 0,
      cue: '「you guys were」のあと、really hard の前。',
      line: 'Last year, you guys were *riding me really hard* for the website',
      said: '「去年、サイトの件でみんなにずいぶん責められた」と言う。',
      mean: 'ride someone hard ＝ しつこく責める・プレッシャーをかける。腹いせの前置き。',
      trap: 'hard から「長時間労働」を想像しやすい。ride ＋ 人 は、その人を責め続けること。',
      use: 'My boss is riding me about the report.（上司に報告書のことで責められてる）' },

    // why: peeled paint ← "peeled" taken literally; a sign ← "knocked … off" heard without "the mirror"
    { id: 'd3', skill: 'detail', level: 'B2', point: 'mirror', reveals: ['riding'], seg: [124.3, 130],
      stem: 'What did Ryan do with his car back then?',
      choices: ['Broke a car’s mirror as he sped off', 'Peeled paint off a car as he parked',
                'Knocked down a sign as he sped off'], a: 0,
      cue: '「peeled out」のあと、knocked の目的語。',
      line: 'I just *peeled out* my Z3 and I *knocked the mirror off* somebody’s car. I never said a thing.',
      said: '「急発進して誰かの車のミラーを飛ばし、黙っていた」と告白する。',
      mean: 'peel out ＝ タイヤを鳴らして急発進する。',
      trap: 'peel を「はがす」と取ると塗装の話に思える。peel out は急発進の決まった言い方。',
      use: 'He peeled out of the parking lot.（彼は駐車場から急発進した）' },

    // R fix: V2 (blind 70 %) and the cue leak on "serious" — "run out of time" was close to true ("What time we
    //   got"), so the distractors are now silence and Holly's later complaint; the cue no longer quotes "serious"
    // why: no one else speaks ← the long pause after the reactions; Holly's complaint ← "over the line" comes later,
    //   in private, and is easy to move earlier in memory
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', seg: [145.2, 196.5],
      stem: 'How does Michael bring the seminar to an end?',
      choices: ['He cuts it off right after a serious confession', 'He wraps it up when nobody else is willing to talk',
                'He ends it once Holly says it went too far'], a: 0,
      cue: 'メレディスへの反応のあと、何が起きるか。',
      line: '*Wow! What time we got.* You know what? *That’s a good place to end it.* Right there.',
      said: '業者との取引の告白で場が深刻になると、「おっと、ここで終わろう」と切り上げる。',
      mean: '時間は口実。都合の悪い話が出たとたんに打ち切る。',
      trap: 'over the line はあとで二人きりのときに出る。順番を取り違えやすいので、何の直後に締めたかを聞く。',
      use: 'Let’s stop there for today.（今日はここまでにしよう）' },

    // C2: what is he trying not to say? (cf. g2)
    // anchor: 141.4–144.3 s "discounts on our supplies", then 171.4–176.5 s "What time we got… That's a good place to
    //   end it. Right there." with no time named; 206–218 s he waves off Holly's "serious issues"
    // why: a waste ← praise that big heard as sarcasm about the seminar; tired ← "What time we got" taken as his real
    //   reason
    // R fix: K1 — "the supply deal dropped" read both ways (the topic dropped / the deal ended, the opposite); the key
    //   now says the deal is left alone
    // retired: for the draws (it shares g2’s point, so play 3+ under g2 drew no C2)
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'end', reveals: ['unknowable'], seg: [171, 194], retired: true,
      stem: 'When Michael calls it “a great ethics seminar”, what is he trying not to say?',
      choices: ['That he wants the supply deal left alone', 'That the whole seminar was a waste of time',
                'That he is tired and wants a break'], a: 0,
      cue: '何の話の直後に、急に終わらせたか。',
      line: 'That’s a good place to end it. Right there. This, I think, was *a great ethics seminar*.',
      said: '備品の値引きにつながる取引の告白の直後、「いい区切りだ。素晴らしい研修だった」と締める。',
      mean: 'ほめ言葉で問題の告白から話をそらす。値引きは「うちの備品」で、会社の得にもなる。',
      trap: 'ほめすぎを皮肉と取りやすいが、二人きりでもほめる。急な締めは何の直後かで読む。',
      use: 'Well, look at the time! Let’s wrap up.（おっと、もうこんな時間。終わろう）' },

    // R fix: V2 (blind 50 %, right: the rules choice was off-topic) — a real-question reading of "Who's to say?"
    //   replaces it, so all three are about what was said
    // why: think it over ← "wonderful things to think about" taken at face value; open a debate ← "Who's to say,
    //   really?" heard as a real question to the room
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'unknowable', reveals: ['end'], seg: [176.4, 191.3],
      stem: 'When Michael wraps up with thoughts on right and wrong, what is he doing?',
      choices: ['Dodging any judgment of what was said', 'Asking them to think hard about what was said',
                'Opening a group debate on what was said'], a: 0,
      cue: '「What is wrong」のあと、Who で始まる問い。',
      line: 'What is wrong. *Who’s to say, really*, in the end? I mean, because it is *unknowable*.',
      said: '「何が悪いかなんて、結局誰に分かる？知りようがない」と言って拍手に移る。',
      mean: 'Who’s to say ＝ 誰にも決められない。判断を避けて、話を終わらせる言い方。',
      trap: '倫理の話なので本気の問いかけに聞こえる。すぐ拍手に移るなら、考えさせる気はない。',
      use: 'Who’s to say what’s right?（何が正しいかなんて、誰に言える？）' },

    // R fix: V2/K6 (blind 55 %: the key was the only two-part, hedged choice) — three plain one-clause choices
    // why: right moment ← "pulled … out" heard as "pulled the plug" in time; got the truth ← "pull out" = draw
    //   something out
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'pulled', seg: [199, 205],
      stem: 'In private, what does Michael tell Holly about the meeting?',
      choices: ['She saved a meeting that nearly flopped', 'She ended it at just the right moment',
                'She got the whole truth out of everyone'], a: 0,
      cue: '「truly impressed」のあと、that に続く部分。',
      line: 'I am truly impressed that you really *pulled that one out*.',
      said: '二人きりで「よく乗り切った。お祝いしよう」とほめる。',
      mean: 'pull it out ＝ 危ない状況をなんとか成功に持ちこむ。',
      trap: 'pull out を「引き出す」「抜く」と取ると、本音を引き出した、早めに切り上げたと思える。',
      use: 'We were losing, but we pulled it out.（負けてたけど、なんとか勝った）' },

    // R fix: N4 — the trap claimed the "are"-less form never asks for an answer ("What're you gonna do?" is the same
    //   shrug); it now rests on the "Yeah" before it. A broken character in `mean` repaired
    // C2: which reply would show she understood? (cf. f4)
    // anchor: 215.2–217.3 s "Yeah." then "What you gonna do?": agreement, then the fixed shrug (no "are"), after his
    //   "Who's to say… it is unknowable" (186–190 s)
    // why: real question ← the words read literally as "What are you going to do?"; thanks ← his praise just before
    //   ("Classic meeting, we should celebrate")
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'gonna', reveals: ['line'], seg: [206.3, 218.2],
      stem: 'Which reply from Holly would match what Michael means at the very end?',
      choices: ['So we just let it go? Really?', 'I’ll talk to her this afternoon.', 'Thanks. I think it went well, too.'],
      a: 0,
      cue: '「Yeah.」のあとの短い一言。何を求めているか。',
      line: 'Meredith’s actions are really over the line. — Yeah. *What you gonna do?*',
      said: '「一線を越えている」と言われ、マイケルは「まあね。しょうがないよ」と返す。',
      mean: 'What (are) you gonna do? は「どうしようもない」と肩をすくめる決まり文句。何もしない宣言。',
      trap: '文字通りだと「君はどうする？」。直前の Yeah から、答えを求めない決まり文句と分かる。',
      use: 'It’s raining again. What can you do?（また雨か。しょうがないね）' },

    // R fix: V2 (blind 70 %) — "no worse than the rest" was refuted by the stem's "compared with"; the stem is now
    //   neutral and a "gray area" reading (after "Who's to say") replaces it
    // why: nearly ← "line" heard as a limit not yet passed; gray area ← "line" heard as the blurry line between
    //   right and wrong that Michael just called unknowable
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'line', seg: [209.6, 215.6],
      stem: 'What does Holly say about Meredith’s actions?',
      choices: ['They clearly went too far', 'They nearly went too far', 'They were a real gray area'], a: 0,
      cue: '「but Meredith’s actions」のあと。',
      line: 'all of you have done things I wouldn’t have done myself, but Meredith’s actions are *really over the line*.',
      said: '「みんなもいろいろしたけど、メレディスのは一線を越えている」と言う。',
      mean: 'over the line ＝ 許される範囲を越えた。',
      trap: 'line を「境目」と取ると、まだ手前、あいまい、とも読める。over は越えたこと。but のあとが本題。',
      use: 'That joke was a little over the line.（あの冗談はちょっと行きすぎ）' },
  ]
};
