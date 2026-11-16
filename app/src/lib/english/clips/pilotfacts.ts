// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 2
// Q: s1 — "Don't we all?" is a set phrase, so a learner who knows it may fill the gap without listening. Keep it as
//   a sound item (the n kept, the t gone), or swap the gap to another reduced stretch?
// “Pilot Episode Fun Facts | A Peacock Extra | The Office US” (the official The Office channel, BEST OF SEASON 1): scenes
// from the pilot. Michael calls himself the best boss, bins corporate's mail, says he won't tell the staff some bad news,
// meets the new temp, fake-fires Pam as a prank, and announces that one of two branches may be cut; Dwight is all for
// downsizing and finds his stapler in Jell-O again.
// Segments from the captions, words from whisper (2026-11-16). Whisper's times are rounded to whole seconds from 150 s
// on, so every segment follows the captions. Whisper hallucinates two loops: "Shut it up" (128–150 s, the captions are
// empty there) and "You have to eat it out of me" (292–313 s); no item uses either stretch.
// Names said in the audio: Michael (“Mr. Scott”), Pam, Jim, Jan, Ryan. Dwight's name isn't said; stems use it, and no
// key depends on who he is. Both sources spell the branch “Stanford”; the line uses Stamford, and no choice names it.
// Overlaps: 260–313 s is the scene in glFrp-CmNVA (staplerjello, banked), and 175–260 s is also in T3YkqbP-4ao
// (“Michael Fires Pam”). Only a2 here touches the Jell-O scene.
// Untested on purpose: 31–34 s (“if you think she's cute now…”), 53–64 s (the cat party; neither speaker is named),
// 76–88 s (the temp's name and the Moe Howard / Three Stooges gag: garbled, world knowledge, visual), 112–113 s
// (“Downsizing?” vs “i'm testing”), 125–128 s, 151–153 s (the Six Million Dollar Man; n1 keys on the figure only),
// 174 s (“Don't pimp me” in both, likely a mishearing), 176–179 s, 288–292 s (the stapler).
// EAR CHECK: 0–14 s a1 — Michael's quoted praise is sincere, not self-mocking (key: proud; tone, with “sums it up”)
// EAR CHECK: 161.5 s s1 — “Don't we” linked, its t dropped and the n kept (both sources: “don't we all”)
import type { Clip } from '../types.ts';

export const pilotFacts: Clip = {
  id: 'pilotfacts', video: '03gvTKxMOFE', title: 'Pilot Episode Fun Facts | A Peacock Extra', dur: 313, wpm: 186,
  band: 'fast', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right): the key was the only positive, sure choice. All three now take the praise one way.
    // why: unsure ← "I think that pretty much sums it up" heard as trailing off, modest (謙遜); poking fun ← quoting
    //   praise about yourself can sound like sarcasm
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'boss', seg: [0, 15.0],
      stem: 'In his opening words to the camera, how does Michael seem to feel?',
      choices: ['Pleased, though unsure he deserves it', 'Proud, and sure that he deserves it',
                'Amused, and poking fun at the praise'], a: 1,
      cue: '褒め言葉を並べたあと、締めの一言。',
      line: 'People say *I am the best boss*. … I think that *pretty much sums it up*.',
      said: '「みんな私を最高の上司と言う。『面白い』とも」と話し、「まあそんなところ」と締める。',
      mean: 'sums it up ＝「言い尽くした」。照れも皮肉もなく、本気でそう思っている。',
      trap: '褒め言葉は謙遜か皮肉で言うもの、と思うとずれる。締め方で判断する。',
      use: 'I think that pretty much sums it up.（まあ、そんなところかな）' },

    // R fix: V2 (blind 50 %, right): "doesn't take it seriously" was the only stance; now three concrete habits.
    // why: kept apart ← "special filing cabinet" taken literally, as care for the papers; fed up with Pam ←
    //   "How many times have I told you" heard as real anger
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'corporate', seg: [42.3, 50.4],
      stem: 'What does Michael’s question about corporate’s papers show about him?',
      choices: ['He treats what corporate sends as trash', 'He keeps corporate’s papers apart from the rest',
                'He is fed up with how Pam files them'], a: 0,
      cue: '「special filing cabinet」の正体。',
      line: 'a *special filing cabinet* for things from corporate? … It’s called the *waste paper basket*.',
      said: '「本社の書類用の特別な棚があると何度言った？」と聞き、「ゴミ箱のことだ」と言う。',
      mean: '本社の書類はそのまま捨てる、という冗談。本社の指示を軽く見ている態度が出ている。',
      trap: '本気の叱責に聞こえやすい。オチまで聞いてから判断する。',
      use: 'How many times have I told you?（何回言ったらわかるの？）' },

    // R fix: V4/V5: the key is said outright ("No, I'm not going to tell them"), so detail B1, not infer B2.
    // why: tell later ← a doctor waits for test results before telling, so "not yet" sounds like the plan; someone
    //   else ← "as a doctor" heard as handing the news to an expert
    { id: 'i2', skill: 'detail', level: 'B1', point: 'tell', seg: [64.95, 72.0],
      stem: 'In this talking head, what has Michael decided?',
      choices: ['To tell them once he is sure', 'To let someone else tell them', 'To keep the bad news from them'], a: 2,
      cue: 'No のあと、理由として出すたとえ。',
      line: 'Am I going to tell them? *No, I’m not going to tell them*.',
      said: '「みんなに言う？いや、言わない。意味がない」と自問自答し、医者のたとえを出す。',
      mean: '悪い知らせを自分の胸にしまっておくと決めている。何の話かは、後の場面で分かる。',
      trap: '医者のたとえから「確かめてから言う」と考えやすい。自問自答の No が答え。',
      use: 'I don’t see the point of that.（それ、意味ないと思う）' },

    // R fix: V2 (blind 55 %, right): only the key was about illness. All three now read the doctor frame (passing,
    //   tests, deadly).
    // why: minor ← his own framing ("I don't see the point"), the reassurance he means; uncertain ← a doctor's usual
    //   step, tests before telling
    // anchor: 68.6–71.6 s the example he picks is "cancer": by his own comparison, the news he's hiding is that serious
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'tell', seg: [64.95, 72.0],
      stem: 'Taken seriously, what would the doctor comparison tell his staff?',
      choices: ['That the news is minor and will soon pass', 'That the news is unsure until it’s checked',
                'That the news is grave, like a deadly illness'], a: 2,
      cue: 'たとえに選んだ病名の重さ。',
      line: '*As a doctor*, you would not tell a patient if they had *cancer*.',
      said: '「言う意味がない。医者だって、がんの患者には言わないだろう」と理由を付ける。',
      mean: '言わない理由のつもりのたとえが、知らせの重さを語ってしまう。がんと並べた時点で「深刻な話」と伝わる。',
      trap: '本人の「意味がない」に引っぱられ、軽い話と取りやすい。たとえ話では、選んだ例の重さが本音を表す。',
      use: 'That’s like saying the Titanic had a leak.（タイタニックが少し漏れた、と言うようなもの）' },

    // R fix: V2 (blind 50 %, right): the key was the only playful choice and "No…elsewhere" a filler. Now a
    //   playful/sincere × me/not-me grid.
    //   + S4: the end cut into the next word (good, 75.84 s); now [72.8, 75.8].
    // why: owns up ← "guilty" read literally, as admitting a fault; not me ← a joking one-word answer heard as a
    //   playful dodge
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'guilty', seg: [72.8, 75.8],
      stem: 'When the newcomer asks for Mr. Scott, what does Michael’s one-word answer mean?',
      choices: ['That’s me, said playfully', 'That’s me, and he owns up to a fault', 'Not me, said playfully to tease'],
      a: 0,
      cue: '名前を聞かれた直後の、短い一語。',
      line: 'This is Mr. Scott? — *Guilty.*',
      said: '新人が「スコットさんですか？」と聞き、マイケルが一語で答える。',
      mean: 'Guilty は「有罪」でなく「はい、私です」のおどけた返事。名指しされたときによく使う。',
      trap: '辞書の「有罪」から謝罪と取りやすい。名前を聞かれた返事なら、まず「本人だ」と考える。',
      use: 'Who ate the last cookie? — Guilty.（最後のクッキー食べたの誰？—私です）' },

    // R fix: V2 (blind 50 %, right): "temp" was only in the key (and other stems say "the temp"). Now all three
    //   name the agency, and "start today" decides.
    //   + S4: the end cut into “Howard” (81.04 s); now [76.95, 81.0].
    // why: interview ← a young stranger at the boss's office, the usual job-interview script; drop off ← "sent me
    //   down" heard as dropping something off
    { id: 'd1', skill: 'detail', level: 'B1', point: 'temp', seg: [76.95, 81.0],
      stem: 'Why has the young man come to the office?',
      choices: ['To interview for a job through a temp agency', 'To drop off papers from his temp agency',
                'To begin a job from a temp agency today'], a: 2,
      cue: '名乗ったあと、最後の動詞と「いつ」。',
      line: '…from the *temp agency*. … sent me down to *start today*.',
      said: '派遣会社から来て、今日から働くと名乗る。',
      mean: 'temp ＝ 派遣・臨時の社員。start today で、今日が初日だと分かる。',
      trap: 'sent me down を「届けに来た」と取りやすい。start today なら初日。',
      use: 'I’m the new temp. I start today.（新しい派遣の者です。今日からです）' },

    // why: noise rules ← "violation" heard as any office rule; the exit ← blocking a way out is the usual safety rule
    { id: 'd2', skill: 'detail', level: 'B1', point: 'safety', seg: [95.0, 103.0],
      stem: 'What reason is given for “You can’t do that”?',
      choices: ['The speaker could fall and get hurt', 'It breaks the office rules on noise', 'It would block the way to the exit'], a: 0,
      cue: 'violation のあと、具体的に何が起きるか。',
      line: '*Safety violation*. I could *fall and pierce an organ*.',
      said: '「安全規則違反だ。転んで内臓に刺さるかもしれない」と理由を言う。',
      mean: 'pierce an organ ＝ 内臓に穴が開く。大げさだが、理由はけがの危険。',
      trap: 'violation から別の規則を想像しやすい。理由は直後の I could のあとに来る。',
      use: 'Careful, that’s a safety hazard.（気をつけて、それ危ないよ）' },

    // why: hired to cut ← "since I first got here" heard as his job being to cut jobs; worried ← asking in an interview
    //   whether your job is safe is the usual nervous move
    { id: 'h2', skill: 'humor', level: 'C1', point: 'interview', seg: [108.8, 121.6],
      stem: 'Why is Dwight’s remark about his job interview funny?',
      choices: ['He pushed for job cuts while asking for a job', 'He was hired just to cut other people’s jobs', 'He asked in the interview if his job was safe'], a: 0,
      cue: 'even のあと、いつ言い出したか。',
      line: 'I’ve been *recommending downsizing* since I first got here. I even brought it up *in my interview*.',
      said: '「削減は来た時から勧めてる。面接でも言った」と話す。',
      mean: '雇ってもらう場で「人を減らせ」と言う矛盾が笑い。自分は切られないと信じきっている。',
      trap: '来た時から、と聞くと削減役で雇われたと取りやすい。勧めたのは本人。',
      use: 'I even brought it up at the meeting.（会議でも言ったんだよ）' },

    // R fix: V2 (blind 50 %, right): the key was the only willing choice. Now three stances toward the cuts.
    // why: keep pushing ← "bring it" heard as "bring it up" from the line before; over with ← "bring it" as "let's
    //   have it now", but as a chore
    { id: 'p3', skill: 'phrase', level: 'B1', point: 'bringiton', seg: [121.6, 124.9],
      stem: 'How does Dwight end his comments on downsizing?',
      choices: ['He’ll keep pushing for it at work', 'He’d rather get it over with fast', 'He dares the cuts to come his way'],
      a: 2,
      cue: 'I say のあと、短い3語。',
      line: 'I say, *bring it on*.',
      said: '「どんと来い」と言って、削減の話を締める。',
      mean: 'bring it on ＝「かかってこい、受けて立つ」。挑戦や困難を歓迎するときの言い方。',
      trap: '直前の brought it up に引かれ「また話題にする」と取りやすい。on が付くと挑戦の意味。',
      use: 'A tough game? Bring it on.（強敵？受けて立つよ）' },

    // why: $16 million / $60 million ← six, sixteen and sixty blur at speed; $6,000 ← "million" missed after "six"
    { id: 'n1', skill: 'number', level: 'B1', point: 'salary', seg: [150.6, 158.3],
      stem: 'What salary does Michael say would suit him?',
      choices: ['$6,000', '$6 million', '$16 million', '$60 million'], a: 1, keep: true,
      cue: 'salary for me のあと、確かめるように繰り返す額。',
      line: 'that would be a *good salary for me*, don’t you think? *Six million dollars*?',
      said: '番組名から「この額は私にいい給料だ」と冗談を言う。',
      mean: 'six million ＝ 600万。2回出るので2回目で確かめる。番組名は知らなくていい。',
      trap: 'six と sixty、sixteen は速いと混ざる。-teen は長く強い。',
      use: 'What’s the starting salary?（初任給はいくらですか）' },

    // R fix: V2 (blind 50 %, right): the key's "everyone feels that way" was the only sensible reading. Distractors
    //   are now closer to the words.
    //   + S4: the start cut “dollars” (157.68 s); now [158.2, 162.3].
    // why: agrees ← a yes-shaped reply heard as support (the Japanese 「そうですね」 frame); asks ← "Don't we…?"
    //   taken as a real question about raises for everyone
    { id: 'r2', skill: 'pragma', level: 'B2', point: 'raise', seg: [158.2, 162.3],
      stem: 'When Michael says he deserves a raise, what does the reply do?',
      choices: ['Agrees, since he works so hard', 'Shrugs it off as what anyone wants',
                'Asks if the raise covers all of them'], a: 1,
      cue: '返事の形は質問。でも答えを待っている？',
      line: 'I deserve a raise. — *Don’t we all?*',
      said: '「私は昇給に値する」に、「みんなそうでしょ」と返される。',
      mean: 'Don’t we all? は「誰だってそう思ってる」。質問の形で、特別な話じゃないと軽く流す。',
      trap: '本当の質問や同意に聞こえやすい。答えを待たない疑問は、流す合図。',
      use: 'I need a vacation. — Don’t we all?（休みが欲しい。—みんなそうだよ）' },

    // R fix: V2 (blind 70 %, right): "Don't you" was easy to rule out after "all". "Won't we" (w/d, same vowel
    //   and n't) replaces it. The set phrase still helps a little; noted as an open question.
    //   + S4: the start cut “dollars” (157.68 s); now [158.2, 162.3].
    // why: Do we ← the n't swallowed; Didn't we ← the d of "don't" heard as a past form; Won't we ← w and d blur
    //   before the same "-on't" 
    { id: 's1', skill: 'sound', level: 'B2', point: 'raise', seg: [158.2, 162.3],
      stem: 'Fill the gap in the reply: “___ all?”',
      choices: ['Don’t we', 'Do we', 'Didn’t we', 'Won’t we'], a: 0,
      cue: '返事の最初、つながって短い2語。',
      line: '*Don’t we* all?',
      said: '昇給の話に、短く「みんなそうでしょ」と返す。',
      mean: 'Don’t we が「ドンウィ」に近くつながり、t はほぼ消える。n の音は残る。',
      trap: 'n’t の t が消えて Do we に聞こえやすい。「ン」が残れば否定の疑問文。',
      use: 'Don’t you love this song?（この曲、いいよね）' },

    // R fix: V2 (blind 55 %, right): "Film a TV show" and "sit quietly" were weak. Now each is a reading of the words
    //   said.
    //   + S4: the start cut “all” (161.92 s); now [162.3, 174.95].
    // why: watch shows ← "do you like…?" about two shows heard as an invitation; copy him ← "follow my lead" read
    //   literally, for the whole day
    { id: 'i3', skill: 'infer', level: 'B2', point: 'prank', seg: [162.3, 174.95],
      stem: 'What does Michael want the temp to help him do?',
      choices: ['Play a trick on someone in the office', 'Watch some prank shows with him later',
                'Copy everything he does for the day'], a: 0,
      cue: 'accomplice と、直前の2つの番組の話。',
      line: 'you are gonna be my *accomplice*. *Just go along with it*, okay?',
      said: 'ドッキリ番組が好きか聞き、「君は共犯者。話を合わせて」と頼む。',
      mean: 'accomplice ＝ 共犯者。番組の話と合わせ、誰かを引っかける計画だと分かる。',
      trap: '番組名から「撮影」と思いやすい。accomplice が仕掛けの合図。',
      use: 'Just go along with it, okay?（話、合わせてね）' },

    // R fix: V2 + S1 (blind 55 %, right): "really going on" hinted at a twist, and only the key had one. The stem
    //   is neutral now, and all three are firings with the temp in the room.
    //   + S4: the start cut “all right” (174.72 s); now [174.9, 212.9].
    // why: make room ← the new temp sits in, so he could be her replacement; witness ← "as you know, there is going to
    //   be downsizing" and "theft" sound like a real firing, with the temp there to watch
    { id: 'g1', skill: 'gist', level: 'C1', point: 'prank', reveals: ['theft', 'letgo'], seg: [174.9, 212.9],
      stem: 'What is Michael doing in his meeting with Pam?',
      choices: ['Faking a firing, with the temp in on it', 'Firing her to make room for the temp',
                'Firing her, with the temp as a witness'], a: 0,
      cue: '会議の前に、新人に頼んでいたこと。',
      said: '新人を同席させ、パムに「最初に辞めてもらう。理由は窃盗」と告げる。',
      mean: '直前に新人へ「共犯者になって、話を合わせて」と頼んでいた。解雇はドッキリの芝居。',
      trap: 'corporate や downsizing が本物らしく聞こえる。直前の段取りが鍵。',
      use: 'Relax, I’m just messing with you.（落ち着いて、からかっただけ）' },

    // R fix: V2 (blind 50 %, right): the key was the only dramatic choice. Three parallel "first to…" now.
    // why: go home early ← "let you go" read literally; first to hear ← "first" tied to the news, not to the cuts
    { id: 'p5', skill: 'phrase', level: 'B1', point: 'letgo', reveals: ['downsize'], seg: [188.3, 201.6],
      stem: 'What does Michael tell Pam is going to happen to her?',
      choices: ['She’ll be the first to go home today', 'She’ll be the first to hear the news',
                'She’ll be the first one to be laid off'], a: 2,
      cue: 'downsizing のあと、going to have to の先。',
      line: 'there is going to be *downsizing*. … I am going to have to *let you go first*.',
      said: '「削減があるのは知ってるね。最初に辞めてもらう」と告げる。',
      mean: 'let ... go ＝ 解雇する。have to で「仕方なく」の形をとるのが定番。',
      trap: '直訳の「行かせる」から早退と取りやすい。downsizing の直後なら、仕事を失う話。',
      use: 'They had to let ten people go.（10人が解雇された）' },

    // R fix: S4: the start cut “Why?” (203.44 s); now [203.85, 206.85].
    { id: 'x2', skill: 'dict', level: 'B1', point: 'theft', seg: [203.85, 206.85],
      stem: 'Type Michael’s reason: “Well, ___.” (3 words)', answer: 'theft and stealing',
      cue: '「Why?」と聞かれたあと、Well に続く3語。',
      line: 'Well, *theft and stealing*.',
      said: '理由を聞かれ「窃盗と、盗み」と答える。',
      mean: 'theft も stealing も同じ「盗み」。同じことを2回言っているのがおかしい。',
      trap: 'theft の th は舌を歯に当てる音で、「セフト」とは違う。似た意味の語が並ぶこともある。',
      use: 'Is that theft, or just borrowing?（それ盗み？借りてるだけ？）' },

    // R fix: V2 (blind 50 %, right): "a small slip" was a filler. It now fixes the wording, keeping the rank.
    //   + S4: the start fell inside “kind of want to say”; now [216.0, 220.4].
    // why: grander ← the longer title sounds more senior (more words, more rank); a slip ← "to the" heard as a small
    //   grammar fix
    { id: 'h3', skill: 'humor', level: 'C1', point: 'title', seg: [216.0, 220.4],
      stem: 'What does the correction of Dwight’s job title do?',
      choices: ['Gives him a grander title than he claimed', 'Fixes his wording but keeps the same rank',
                'Makes his job sound much less important'], a: 2,
      cue: '2つの肩書きの、増えた2語。',
      line: 'I’m *assistant regional manager*. — *Assistant to the* regional manager.',
      said: '「副地域部長だから先に知るべき」と言うと、「地域部長の補佐」と直される。',
      mean: '前者は副部長、assistant to the は部長の「お付き」。to the で格が下がる。',
      trap: '長い方が偉そうに聞こえるが、to the が入ると「〜の補佐」。',
      use: 'I’m the assistant to the director.（部長の補佐をしています）' },

    // why: the boss ← he seems to drag out the news, so the joke can look aimed at him; the staff ← they're kept
    //   waiting while the two argue
    // anchor: 230.6–233.4 s "Can you tell them with my permission? — I don't need your permission. — Permission
    //   granted": the grant answers a refusal; at 224 s the boss has said he's "about to tell everyone"
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'permission', seg: [226.5, 233.7],
      stem: 'In the talk about telling the staff, who is the joke on?',
      choices: ['The one who keeps the news from his staff', 'The one who grants a permission nobody needs',
                'The staff, who are kept waiting for news'], a: 1,
      cue: '「必要ない」と言われた直後の返し。',
      line: 'with my permission? — I don’t need your permission. — *Permission granted.*',
      said: '「僕の許可で発表しては？」「許可は要らない」「許可する、どうぞ」と続く。',
      mean: '断られた許可をそれでも与えて、面目を保とうとする。偉いつもりの部下が、自分で格の低さを見せている。',
      trap: '発表をじらす上司が笑いの的に見えるが、彼は「今言う」と言っている。最後の一言が誰の返しかを流れで追う。',
      use: 'You may go. — I wasn’t asking.（行ってよし。—聞いてないけど）' },

    // R fix: S3: the cue named "or", a word only the key had. Now it points at "either" alone.
    //   + S4: the start cut “go ahead” (233.28 s); now [233.78, 245.4].
    // why: merge ← two branches named together sound like a merger; move Michael ← "upon me" heard as him being sent
    //   to the other branch
    { id: 'd3', skill: 'detail', level: 'B2', point: 'branch', seg: [233.78, 245.4],
      stem: 'What is Jan thinking about, according to Michael?',
      choices: ['Cutting back this branch or one other', 'Merging this branch with another one', 'Moving Michael over to another branch'], a: 0,
      cue: 'either のあとに並ぶ2つ。',
      line: 'Jan is thinking about *downsizing either the Stamford branch or this branch*.',
      said: '「ジャンは別の支店かここの縮小を考えている」と発表する。',
      mean: 'either A or B ＝ AかBのどちらか。2つの支店のうち、片方が縮小される。',
      trap: '2つの支店名が並ぶと合併に聞こえやすい。either ... or は「どちらか一方」。',
      use: 'Either Friday or Monday works for me.（金曜か月曜なら大丈夫）' },

    // R fix: V2 (blind 55 %, right): "calm" and "relieved" were thin. Reassured now has a reason in the words.
    //   + S4: the start cut “go ahead” (233.28 s); now [233.78, 259.9].
    // why: relieved ← the cuts might hit the other branch; reassured ← "just like I'm doing" heard as the boss
    //   sharing their lot
    { id: 'g2', skill: 'gist', level: 'B2', point: 'meeting', reveals: ['downsize', 'branch'], seg: [233.78, 259.9],
      stem: 'By the end of Michael’s announcement, how is the staff feeling?',
      choices: ['Uneasy, some sure they’ll be the one cut', 'Relieved, thinking the other branch will go',
                'Reassured, since the boss is in it with them'], a: 0,
      cue: '質問と、「たぶん自分だ」のやりとり。',
      said: '支店縮小の発表に「どういう意味？」と質問が出て、「履歴書を更新して」と返される。',
      mean: '自分が切られるかもと心配する声と、「くそっ」が続く。部屋の空気は不安。',
      trap: '縮小がもう一方の支店なら安心だが、どちらかはまだ決まっていない。',
      use: 'Should I be worried?（心配したほうがいい？）' },

    // R fix: V1/V2 (blind 60 %, right): "downsizing = job cuts" is word knowledge, so the key came without audio.
    //   All three are now ways a branch shrinks; only "update your resumes" settles it.
    // why: moved ← two branches were just named, so a transfer sounds likely; fewer hours ← a common way to cut costs
    //   without layoffs
    { id: 'i4', skill: 'infer', level: 'B2', point: 'downsize', seg: [245.3, 252.1],
      stem: 'From Michael’s answer, what does downsizing mean for the staff?',
      choices: ['Some of them may need to find new jobs', 'Some may be moved to the other branch',
                'All of them may work fewer hours'], a: 0,
      cue: '「意味は？」への返事。何を準備しろと言う？',
      line: 'What does downsizing actually mean? — Well, you guys gotta *update your resumes*…',
      said: '「縮小って結局どういうこと？」に、「履歴書を更新しておけ」と答える。',
      mean: '履歴書の準備は転職の準備。仕事を失う人が出るという意味を、遠回しに伝えている。',
      trap: '2つの支店名から「異動」と取りやすい。答えの中の具体的な行動から意味を推す。',
      use: 'Time to update my resume.（そろそろ履歴書を書き直すか）' },

    // R fix: B1/C4: own point `bosssafe` (it reveals `downsize`, i4's resumes), and `mean` no longer states the room's
    //   mood (g2's key). g2 used to block it, so the last unseen C2 couldn't come on play 4.
    // why: routine ← "just like I'm doing" heard as the boss setting a calm example (the reassurance taken at face
    //   value); lined up ← "doing" heard as done, a new job already found
    // anchor: 249.2–251.8 s "update your resumes just like I'm doing", right after "either the Stamford branch or this
    //   branch": the boss is job-hunting too
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'bosssafe', reveals: ['downsize'], seg: [245.3, 252.1],
      stem: 'What does “just like I’m doing” add to Michael’s answer?',
      choices: ['That it’s routine, so no one should worry', 'That not even the boss thinks he’s safe',
                'That he already has another job lined up'], a: 1,
      cue: '「自分もやっている」と言う人の立場。',
      line: 'you guys gotta update your resumes *just like I’m doing*.',
      said: '「縮小って？」と聞かれ、「履歴書を更新しろ。私もやってる」と答える。',
      mean: '上司まで転職の準備をしている、と自分で明かしている。自分の席も安全ではないと認めたことになる。',
      trap: '「私も」を落ち着いた手本と取りやすい。立場が上の人の「私も」は、危険の大きさを示すことがある。',
      use: 'Even my boss is job hunting.（上司まで転職活動中だ）' },

    // R fix: V2 (blind 50 %, right): "instead of comforting him" made the key the only contrast. Now three
    //   readings of what the answer says.
    //   + S4: the start fell inside “doing” (251.76 s); now [252.1, 259.9].
    // why: just listening ← "yeah" heard as a backchannel (相づち), not agreement; anyone ← the reply heard as "you,
    //   or any of us"
    { id: 'h4', skill: 'humor', level: 'C1', point: 'me', seg: [252.1, 259.9],
      stem: 'When one worker guesses he’ll be the one cut, why do people laugh?',
      choices: ['The answer says “yeah” just to be polite', 'The answer says it could be anyone',
                'The answer agrees that it will be him'], a: 2,
      cue: 'yeah のあと、誰のことを言っている？',
      line: 'I bet it’s gonna be me. … — *Yeah, it’ll be you.* — Damn it!',
      said: '「たぶん僕だ」と言う人に、「うん、君だね」と返り、本人は「くそっ」。',
      mean: '普通なら「そんなことない」と慰める場面で、あっさり同意する。期待とのずれが笑い。',
      trap: 'Yeah を相づちと取りやすいが、it’ll be you が同意を決める。',
      use: 'Don’t worry, it won’t be you.（大丈夫、君じゃないよ）' },

    // R fix: V2 (blind 55 %, right): "grateful" was a filler and the key the only two-part answer. Now three
    //   "feeling, and doing" pairs.
    // why: amused ← "professional" and "thanks" taken at face value; polite ← "Thanks" read as courtesy (the Japanese
    //   お礼 frame) despite the annoyance
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'professional', seg: [264.5, 273.7],
      stem: 'How does Dwight feel about finding his things in Jell-O again?',
      choices: ['Amused, and praising the joke as well done', 'Tired, but trying to stay polite to Jim',
                'Annoyed, and mocking Jim with fake praise'], a: 2,
      cue: 'お礼の前の一言と、このあとの「何回目」。',
      line: '*That’s real professional.* Thanks. This is the *third time*, and it *wasn’t funny*…',
      said: '「またゼリーに入れたな。実にプロらしいね、どうも。3回目だ」。',
      mean: 'real professional は皮肉。続く「面白くなかった」で本気の怒りと分かる。',
      trap: 'professional と Thanks だけなら褒め言葉。すぐあとの本音で決める。',
      use: 'Oh great. That’s just perfect.（ああ最高、完璧だね）' },
  ]
};
