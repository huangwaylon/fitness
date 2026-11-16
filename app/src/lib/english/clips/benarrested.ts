// “Ben gets arrested | Parks and Recreation” (the official Parks and Recreation channel, Season 6): on his first day
// as city manager, Ben tries to be the friendly boss and the strict one at once, sharing smuggled French cheese while
// cutting perks; then police take him in over the cheese, and it turns out to be his staff's prank.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈170 s. Untested: 0–7 s (who says “Hello,
// France” and “I don't care”), 25–26 s (the “sacrifice Larry” joke), 68–78 s (the speakers of the phone and
// shower replies are never named), 82–86 s (“Sanitation in the house tonight”, speaker and place unclear), 128.4 s
// (who says “Never.”), 150–153 s (whisper “You're pranked!”, no captions), 153 s (whisper “got to”, captions
// “gotta”), and 139–144 s (the Colorado/Denver joke needs world knowledge; ph2 rests only on the officer's words).
// EAR CHECK: 137.2 s nt3 — both sources have “Seems as you're wanted”; confirm it isn't “Seems like” before shipping
// EAR CHECK: 166.9 s nt1 — “that's super funny” is taken as a forced laugh; the key also stands on “die in federal
//   prison”
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 2 (h4's removed: its key doesn't rest on the
//   whisper/captions difference at 132.7 s)
import type { Clip } from '../types.ts';

export const benArrested: Clip = {
  id: 'benarrested', video: 'EZstVEdHijI', title: 'Ben gets arrested', dur: 191, wpm: 161, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 70 % right; "a shop in town" was a filler and only the key had "smuggled". All three choices are
    //   smuggling now; they differ on who carried it, which "back" and the dropped "I" settle. Level B1 → B2.
    // why: friend ← no subject is said, so anyone could have carried it; mail ← "smuggled… from Paris" fits a parcel too
    { id: 'd1', skill: 'detail', level: 'B2', point: 'cheese', seg: [7.4, 12.4],
      stem: 'How does Ben say the cheese got into the country?',
      choices: ['He smuggled it back from Paris himself', 'A friend smuggled it over from Paris for him', 'He had it smuggled in from Paris by mail'], a: 0,
      cue: '「illegal」のあと、動詞に続く小さな語。',
      line: 'Technically, it’s illegal in this country. *Smuggled it back from Paris*.',
      said: '「この国では違法。パリからこっそり持ち帰った」。主語の I は省略。',
      mean: 'smuggle it back ＝ 旅先から自分で持ち帰る。back が「戻るときに」を表す。',
      trap: '主語が落ちると誰が運んだかぼやける。back のような小さな語が手がかり。',
      use: 'I snuck some snacks into the movie.（映画館にお菓子をこっそり持ち込んだ）' },

    // R fix: V2, blind 70 % right; the key was the only coherent function. Two other sentence-start functions
    //   (self-correction, summing up) replace the fillers.
    // why: corrects ← a sentence-start word right after a risky remark sounds like "I mean"; sums up ← anyway heard as
    //   とにかく, closing the cheese talk with a verdict
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', seg: [10.4, 18.6],
      stem: 'Right after the Paris remark, what does Ben’s next word do?',
      choices: ['Leaves the side topic to start his main one', 'Corrects what he just said about the cheese', 'Sums up why the cheese is worth the risk'], a: 0,
      cue: '「Paris」のすぐあと、文頭の一語。',
      line: '…from Paris. *Anyway*, I want you guys to think of my office as a clubhouse.',
      said: '違法チーズの話のあと「それはともかく、僕の部屋をクラブハウスだと思って」と続ける。',
      mean: '文頭の anyway ＝ それはさておき。脇道を切り上げて、本題に戻る合図。',
      trap: '「とにかく」とまとめる語と取りやすい。後ろが別の話なら、話を戻す合図。',
      use: 'Anyway, where were we?（で、何の話だっけ）' },

    // R fix: V2, blind 70 % right; "join his staff club" and "stress" were weak. Now three readings of her tone. S4: the
    //   seg started after the clubhouse and "friend" lines she reacts to; it's now 12.2–27.0 s.
    // why: scary rules ← "What the hell is wrong with you?" heard as a reaction to bad news; boring ← the same line heard
    //   as fed-up impatience, with the cult joke missed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'cult', seg: [12.2, 27.0],
      stem: 'What does April’s reaction show she thinks of Ben’s welcome?',
      choices: ['She finds his gushing friendliness weird', 'She finds his strict new rules scary', 'She finds his long welcome speech boring'], a: 0,
      cue: '短い質問が三つ続く、その中身。',
      line: 'What the hell is wrong with you? *Are you in a cult? Can I join?*',
      said: '「何なの？カルトにでも入った？私も入れて」と、ベンの話に返す。',
      mean: '明るすぎる上司を、怪しい集団の勧誘にたとえてからかう。Can I join も冗談の続き。',
      trap: 'What the hell… は怒りや退屈にも聞こえる。続く cult が冗談の印。',
      use: 'Okay, who replaced you with a robot?（ねえ、誰とすり替わったの？）' },

    // R fix: V2, blind 80 % right; the vacation and office-hours choices were side details. Two keyword traps from the
    //   camera talk itself (Chris, the hammer) replace them.
    // why: well liked ← "the nice guy that made everyone happy" heard as a popularity worry; hammer ← "brought down the
    //   hammer" heard as the new job, though it was his old one
    { id: 'g1', skill: 'gist', level: 'B2', point: 'both', seg: [13.3, 46.8],
      stem: 'On his first day, what is Ben finding hard to manage?',
      choices: ['Playing the nice boss and the tough one at once', 'Being as well liked as Chris, the nice one', 'Bringing down the hammer now that Chris is gone'], a: 0,
      cue: 'カメラに話す場面の「but now that…」以降。',
      line: 'Chris was always the *nice guy*… while I *brought down the hammer*, but now… I kind of have to *do both*.',
      said: 'カメラに「クリスが優しい役、僕が厳しい役だった。彼がいない今は両方」と話す。',
      mean: '優しい上司と厳しい上司を一人で演じ分ける。それがこの日の苦労。',
      trap: 'Chris も hammer も以前の分担の話。but now のあとの do both が今の悩み。',
      use: 'I have to wear two hats now.（今は一人二役なんだ）' },

    // anchor: 33.5–41 s his talk to the camera: "Chris was always the nice guy… I brought down the hammer, but now
    //   that he's gone, I kind of have to do both"
    // R fix: S4, the seg was 22.7 s (18.8–41.5); the stem now points at the "friend" line and the seg holds only the
    //   camera talk. S3: the cue named Chris, a word only the key had.
    // retired: shares g1's point (both), so play 4 under g1 drew no C2
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'both', seg: [33.0, 41.3], retired: true,
      stem: 'Given his talk to the camera, how should we hear his “friend” line?',
      choices: ['As a part he must play now that Chris is gone', 'As his real self, now free to stop being strict',
                'As a promise that his new rules will be gentle'], a: 0,
      cue: 'カメラへの話の後半、but のあと。',
      line: 'I want to be your *friend* as well as your boss. … Chris was always the *nice guy*… now… I kind of have to *do both*.',
      said: '「友だちでも上司でもありたい」と言ったあと、カメラに「優しい役はクリスだった。今は両方やるしかない」と話す。',
      mean: 'カメラへの一言が場面を書きかえる。親しげな言葉は本心より、クリスの穴を埋める役。',
      trap: '「友だちになりたい」は本心と取りやすい。この形式では、カメラへの話が答え合わせ。',
      use: 'I’m just filling in for my boss.（上司の代わりをしているだけ）' },

    // R fix: V2, blind 60 % right; "proud" was a filler. A worried-about-the-act reading replaces it.
    // why: nervous ← he's rehearsing to the camera, as if unsure of his act; amused ← "Let's eat vitamins" sounds like he's
    //   joking around
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'exhaust', reveals: ['both'], seg: [41.3, 46.8],
      stem: 'How does Ben feel about switching between his two roles?',
      choices: ['Worn out by going back and forth', 'Nervous the staff will see through it', 'Amused by how silly it sounds'], a: 0,
      cue: 'カメラの前で言う、最後の一文。',
      line: 'Everyone is the best. We’re cutting vacation time. … *This is exhausting*.',
      said: '「みんな最高！休暇は削減。ビタミン食べよう！」と切り替え、「疲れる」とこぼす。',
      mean: 'exhausting ＝ ぐったりする。優しい役と厳しい役の行き来に疲れている。',
      trap: '明るい口調が続くので楽しんでいるように聞こえる。最後のひと言が本音。',
      use: 'Moving apartments is exhausting.（引っ越しってぐったりする）' },

    // R fix: V2, blind 75 % right; "practice run" in the stem pointed at the switching, and "out of breath" was a filler.
    //   The stem now names only the moment; a partial-listening choice replaces the filler.
    // why: no kind ones ← only "cutting vacation time" is caught, the cheerful lines around it missed; apologizes ← the
    //   Japanese frame: bad news comes with an apology
    { id: 'h1', skill: 'humor', level: 'C1', point: 'switch', reveals: ['both'], seg: [41.3, 46.8],
      stem: 'As his talk to the camera ends, what makes it funny?',
      choices: ['He flips between cheerful and harsh in seconds', 'He rehearses the harsh lines but no kind ones', 'He apologizes for each harsh line right away'], a: 0,
      cue: '三つの短い文、それぞれの中身。',
      line: '*Everyone is the best.* *We’re cutting vacation time.* *Let’s eat vitamins.*',
      said: '「みんな最高」「休暇を削る」「ビタミン食べよう」を、間をおかずに続ける。',
      mean: '優しい役と厳しい役を数秒ごとに切り替える。一人で両方やる無理が笑い。',
      trap: '真ん中の厳しい一文だけが残りやすい。前後の明るい文と合わせ、三文の並びを聞く。',
      use: 'Good news, bad news, more good news.（良い知らせ、悪い知らせ、また良い知らせ）' },

    // R fix: V2, blind 85 % right; "first" in the stem pointed at a turn. The stem is neutral now, and the distractors
    //   are two readings a partial listener could take from "super-cool" and "Oh, nice".
    // why: vote ← "Oh, nice" from the staff heard as them getting a say; for show ← "super-cool" heard as not serious, with
    //   "super-mandatory" missed
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'supercool', seg: [46.8, 53.5],
      stem: 'What is Ben doing as he brings up his new rules?',
      choices: ['Wrapping rules no one wants in friendly words', 'Letting the staff vote on the rules they like', 'Hinting that the rules are only for show'], a: 0,
      cue: '「Oh, nice」のあとに足される一言。',
      line: 'I have some *super-cool* new rules… that are also *super-mandatory*.',
      said: '「すごくクールな新ルールがある」と言い、喜ばれると「しかも絶対」と足す。',
      mean: '楽しい知らせの包み紙で、嫌な知らせを渡す。super をそろえた言い方も笑い。',
      trap: 'cool だけだとゆるい話に聞こえる。that are also のあとが本当の条件。',
      use: 'Fun news: the meeting is mandatory.（うれしいお知らせ：会議は全員参加）' },

    // why: cell phones ← a later rule, a few lines on; vacation ← "cutting vacation time" from the talk to the camera
    //   just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'facebook', seg: [53.4, 59.9],
      stem: 'Which new rule does the first worker ask about?',
      choices: ['No more Facebook', 'No more cell phones', 'Less vacation time'], a: 0,
      cue: '「we can’t use」のあと。',
      line: 'We can’t use *Facebook* anymore? Are you serious?',
      said: '「もうフェイスブック使えないの？本気？」と聞かれ、ベンが「その通り」と答える。',
      mean: '仕事中のフェイスブック禁止。ベンは「時間の無駄で、生産性が落ちる」と理由も言う。',
      trap: '携帯の禁止も休暇の削減も出てくるので混ざりやすい。最初に聞き返された規則を聞く。',
      use: 'Wait, we can’t park here anymore?（え、もうここに停められないの？）' },

    // R fix: V2, blind 55 % right; "now include families" was the only good news, easy to rule out. A who-loses-it near
    //   miss replaces it.
    // why: pay more ← the usual bad-news script for insurance; lose it themselves ← "don't have it anymore" caught,
    //   "dependents" missed
    { id: 'd3', skill: 'detail', level: 'B2', point: 'insurance', seg: [60.6, 68.25],
      stem: 'What is Ben’s news for sanitation about health insurance?',
      choices: ['Their families will no longer be covered', 'They will have to pay more for their plan', 'They themselves will lose their coverage'], a: 0,
      cue: '「Your dependents」のあと。',
      line: 'Your *dependents don’t have it anymore*.',
      said: '清掃課に「扶養家族はもう保険の対象外」と告げ、すぐチーズを勧める。',
      mean: 'dependents ＝ 扶養家族。家族の保険を切る、かなり厳しい知らせ。',
      trap: 'don’t … anymore だけ拾うと本人の話に聞こえる。対象は dependents。',
      use: 'Does this plan cover dependents?（このプランは家族も対象？）' },

    // why: fifteen ← "five" and "fif-" start alike; ten ← a common length for a break
    { id: 'n1', skill: 'number', level: 'B1', point: 'bath', seg: [73.7, 78.1],
      stem: 'How long does the new rule allow for a bathroom break?',
      choices: ['Five minutes', 'Ten minutes', 'Fifteen minutes'], a: 0, keep: true,
      cue: '「limited to」のあと。',
      line: 'Bathroom breaks should be limited to *five minutes*.',
      said: '「トイレ休憩は5分まで」に「5分じゃシャワーも無理」と返す人がいる。',
      mean: 'limited to ＝ 〜までに制限される。数字は返事の中でもう一度出てくる。',
      trap: 'five と fifteen は出だしが同じ。teen の長い「ティーン」があるかを聞く。',
      use: 'Each talk is limited to ten minutes.（発表は一人10分まで）' },

    // R fix: V2, blind 65 % right; "relaxed, dozing off" was easy to rule out after "really". Three states of strain now,
    //   and the stem doesn't lean on "really".
    // why: tired ← "pop" missed, and his "This is exhausting" from before; scared ← "wound so tight" read as 縮こまる, fear
    { id: 'ph1', skill: 'phrase', level: 'C1', point: 'tight', seg: [77.9, 82.45],
      stem: 'In the comment to the camera, what is Ben like underneath?',
      choices: ['Very tense, and about to lose it', 'Very tired, and about to give up', 'Very scared, and about to run off'], a: 0,
      cue: '「but」のあと、後半の言い方。',
      line: 'he’s acting all *loosey-goosey*, but that little dude’s *wound so tight he’s gonna pop*.',
      said: '「ゆるくふるまってるけど、張りつめていて今にも破裂しそう」と話す。',
      mean: 'wound tight ＝ 神経が張りつめている。pop ＝ はじける、キレる。',
      trap: 'loosey-goosey はふるまい（acting）の話。本当の姿は but のあと。',
      use: 'Relax, you’re wound way too tight.（落ち着いて、張りつめすぎ）' },

    // R fix: V2, blind 85 % right; a police apology and a fine were weak. Two outcomes built from the scene's own lines
    //   replace them.
    // why: agents ← "customs agents coming down from the border" and "Fellas, he's all yours"; cheese ← "this is really good
    //   cheese, you should try some" heard as working
    { id: 'g2', skill: 'gist', level: 'B1', point: 'prank', seg: [87.3, 169.8],
      stem: 'How does Ben’s trouble with the police turn out?',
      choices: ['His own staff turn out to be behind it all', 'He’s handed over to agents from the border', 'He talks his way out by sharing the cheese'], a: 0,
      cue: '最後に出てくる人たちと、ベンの反応。',
      said: 'チーズ密輸で連行され、脱税の容疑まで出るが、最後に部下たちが現れて笑う。',
      mean: '逮捕は部下たちが仕掛けたいたずら。ベンは「やられた」と受ける。',
      trap: '国境の税関や「あとは任せた」につられやすい。最後に出てくる人たちの一言で結末をつかむ。',
      use: 'It was all a big joke.（全部ただの冗談だった）' },

    // R fix: V2, blind 55 % right; "nervous to relieved" ran against the arrest. Now both distractors read "It's just
    //   cheese" a different way.
    // why: offended ← "It's just cheese, guys" heard as indignant; relieved ← the same line heard as calm reassurance
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'panic', seg: [87.3, 100.2],
      stem: 'How does Ben’s mood change once the officers say why they came?',
      choices: ['From breezy to panicked', 'From breezy to offended', 'From uneasy to relieved'], a: 0,
      cue: '警官の説明の前と後、ベンの返事の形。',
      line: 'Hey, the boys in blue. … *No, no, no, no, no*… It’s just cheese, guys.',
      said: '警官に「おや、お巡りさん」と陽気に声をかけ、通報と聞くと「いやいやいや」。',
      mean: '軽口から一転、no の連発で動揺が分かる。ただのチーズ、は必死の言い訳。',
      trap: 'just cheese は「心外だ」とも取れる。no を何度も重ねるのはあわてている印。',
      use: 'No, no, it’s not what it looks like.（違う違う、そういうのじゃない）' },

    // R fix: V2, blind 60 % right; "won't/don't need you to come down" don't fit a police order. Three sound-alike
    //   starts that all fit the slot replace them.
    // why: We'll / We'd ← "we're gonna" squeezed short, heard as one syllable with an l or d; We just ← "gonna" and "need"
    //   blur into a quick "jus'"
    { id: 's1', skill: 'sound', level: 'B2', point: 'station', seg: [105.7, 109.2],
      stem: 'Fill the gap: “___ need you to come down to the station.”',
      choices: ['We’ll', 'We’d', 'We just', 'We’re gonna'], a: 3,
      cue: '文の最初、need の前の短いかたまり。',
      line: '*We’re gonna* need you to come down to the station.',
      said: '「署まで来てもらうことになる」と警官が言う。',
      mean: 'we’re gonna が「ウィアガナ」と短くつながる。going to の会話の形。',
      trap: 'We’ll や We’d なら一拍で終わる。ここはウィアガナと三拍ほど。拍の数を数える。',
      use: 'We’re gonna need a bigger table.（もっと大きいテーブルが要りそう）' },

    // why: agrees ← "I'm sure" heard as 確かに (agreement); asks why ← "not necessary" heard as a question about their
    //   reasons
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'necessary', seg: [108.9, 113.55],
      stem: 'When told to come to the station, how does Ben first respond?',
      choices: ['He politely pushes back on going', 'He politely agrees to go along',
                'He politely asks why he’s needed'], a: 0,
      cue: '「I’m sure」で始まる一文の後半。',
      line: '*I’m sure that’s not necessary.* Let’s just— this is really good cheese.',
      said: '「その必要はないと思いますよ」と言い、チーズを勧める。',
      mean: 'I’m sure that’s not necessary ＝ 丁寧に断る決まり文句。',
      trap: 'I’m sure を「確かに」と取ると同意に聞こえる。断りの中身は not necessary。',
      use: 'Thanks, but that won’t be necessary.（ありがとう、でもそれには及びません）' },

    // R fix: V2, blind 70 % right; the cheese confession was easy to rule out and gave away d1. A wrong-relation reading
    //   of the officer's tag replaces it.
    // why: accuses ← "everyone does it" heard as "you do it too"; charged for denying ← "add that to the charges" caught,
    //   though it follows the admission, not the denial
    { id: 'h4', skill: 'humor', level: 'C1', point: 'jaywalk', seg: [125.6, 134.3],
      stem: 'Why does the jaywalking moment at the station get a laugh?',
      choices: ['He takes back his claim seconds later', 'He accuses the officer of jaywalking too', 'The officer charges him for denying it'], a: 0,
      cue: '「Never.」のあと、ベンの言い直し。',
      line: 'I’ve *never even jaywalked*. … I mean, I… *everyone does it sometimes*. — Just add that to the charges.',
      said: '「信号無視すらしたことない」と言い、「まあ誰でもたまにはする」と言い直す。',
      mean: '強く否定した直後に、小さな違反を自分から認める。警官の「罪状に追加」がとどめ。',
      trap: 'everyone を「あなたも」と取りやすい。I mean は言い直しの合図。',
      use: 'I never eat sweets. Well, sometimes.（甘い物は食べない。まあ、たまに）' },

    // why: California ← the two state names start alike; bank fraud in Denver ← "fraud" caught and "tax" lost, with
    //   Denver, a place he names a moment later
    { id: 'd4', skill: 'detail', level: 'B1', point: 'fraud', seg: [134.5, 139.8],
      stem: 'What do the officers say Ben’s fingerprints show?',
      choices: ['He’s wanted for tax fraud in Colorado', 'He’s wanted for tax fraud in California',
                'He’s wanted for bank fraud in Denver'], a: 0,
      cue: '「wanted for」のあとの二語と地名。',
      line: 'Seems as you’re wanted for *tax fraud in Colorado*.',
      said: '指紋を照合したら「コロラドで脱税の容疑で手配されている」と告げられる。',
      mean: 'wanted ＝ 指名手配されている。チーズの話が大きな罪にふくらむ。',
      trap: 'Colorado と California は出だしが似ている。Denver はあとで出る地名。',
      use: 'He’s wanted for questioning.（彼は事情聴取の対象だ）' },

    // anchor: 137.2–137.8 s both sources have "seems as you're wanted": three weak words, no "it", run into "wanted"
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'fraud', seg: [136.7, 139.8],
      stem: 'Type the officer’s start: “___ wanted for tax fraud.” (3 words)', answer: 'seems as you\'re',
      cue: '「prints」のあと、wanted の前。文法より音を。',
      line: '*Seems as you’re* wanted for tax fraud in Colorado.',
      said: '「どうやら脱税で手配されているようだ」。3語が弱く、ひと続きに聞こえる。',
      mean: '文法どおりなら it seems you’re。会話では it が落ち、like の代わりに as が入ることもある。',
      trap: '習った形に直して it や like を書きたくなる。聞こえた音のまま書く。',
      use: 'Seems like it’s gonna rain.（雨になりそうだね）' },

    // why: out of order ← "straight" read as まっすぐ・順番どおり; leaves out ← "can't keep" heard as not keeping the
    //   details in
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'story', seg: [139.6, 146.35],
      stem: 'What does the officer say is wrong with Ben’s answers?',
      choices: ['He keeps contradicting himself', 'He tells things out of order', 'He leaves too much out'], a: 0,
      cue: '「Man,」で始まる警官の一言。',
      line: 'Man, you *can’t keep your story straight*, can you?',
      said: '「行ったことない」の直後に「乗り継ぎで寄った」と言うベンに返す。',
      mean: 'keep one’s story straight ＝ 話のつじつまを合わせる。',
      trap: 'straight を「まっすぐ」「順番どおり」と取りやすい。ここでは話が一貫していること。',
      use: 'Let’s keep our story straight.（話を合わせておこう）' },

    // R fix: V2, blind 85 % right; the stem's "turn out" and quote pointed at a twist. The stem is plain now, and the
    //   choices are three kinds of people, two built from earlier lines.
    // why: agents ← "customs agents coming down from the border" said a minute before; detectives ← "tax fraud" just came
    //   up, so a new team fits
    { id: 'i1', skill: 'infer', level: 'C1', point: 'prank', seg: [147.3, 161.0],
      stem: 'Who are the people the officer hands Ben over to?',
      choices: ['People who work under Ben', 'Agents up from the border', 'Detectives on the fraud case'], a: 0,
      cue: '最後に出てくる人たちが、ベンを何と呼ぶか。',
      line: 'Fellas, *he’s all yours*! … some fun with *our new boss*.',
      said: '警官が「あとは任せた」と言うと、相手は「新しいボスで遊ぼうと思って」と言う。',
      mean: 'our new boss と言うので、相手はベンの部下。逮捕は最初から仕組まれていた。',
      trap: '国境から税関が来る、という前の話につられやすい。相手がベンを何と呼ぶかを聞く。',
      use: 'You’re in on this, aren’t you?（あなたもグルなんでしょ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'thoughtwed', seg: [157.2, 161.0],
      stem: 'Type what they say: “___ have some fun with our new boss.” (2 words)', answer: 'thought we\'d',
      cue: '「uptight」のあと、文の頭。主語がない。',
      line: 'You seemed a little uptight. *Thought we’d* have some fun…',
      said: '「カタく見えたから、楽しもうと思って」。主語の we が落ちている。',
      mean: 'Thought we’d ＝ We thought we would。',
      trap: 'we’d の d はほぼ聞こえず、thought we に聞こえやすい。',
      use: 'Thought I’d stop by and say hi.（ちょっと顔を出そうと思って）' },

    // R fix: V2, blind 55 % right; "deserved it" was weak. "Uptight", said just before, makes a stronger good-sport trap.
    // why: uptight ← "You seemed a little uptight" just before, as if he agrees; caught ← "got me" read as 捕まえた
    { id: 'ph3', skill: 'phrase', level: 'B2', point: 'gotme', reveals: ['prank'], seg: [161.0, 164.35],
      stem: 'What does Ben admit first, once the joke is revealed?',
      choices: ['That their trick had really fooled him', 'That he had been too uptight with them', 'That they caught him breaking the law'], a: 0,
      cue: '「Wow, this…」の言い直しのあと。',
      line: 'Wow, this— *you got me*. Good one.',
      said: '「わあ、これは…やられた。うまいね」と言う。',
      mean: 'you got me ＝ 一本取られた、だまされた。Good one ＝ うまい冗談だね。',
      trap: 'got me を「捕まえた」と取ると、罪を認めた話に聞こえる。冗談のあとなら「やられた」。',
      use: 'Ha, you got me there.（はは、一本取られた）' },

    // anchor: 164.4–166.9 s "Making me think I was gonna, like, die in federal prison" names the fear in his own
    //   words, right before "that's super funny"; 115.4–116.6 s "Oh, God. I surrender" earlier
    // R fix: V2, blind 50 % right; "guilty about the cheese" was easy to rule out. A sting from "uptight" replaces it.
    // why: photo ← "I'll take a picture… Classic!" comes just before, so anger at the photo fits; uptight ← right
    //   mechanism, wrong target: "You seemed a little uptight" could sting, but the fear is what he names
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'gotme', seg: [161.0, 169.8],
      stem: 'When Ben calls the prank “super funny”, what is he trying not to show?',
      choices: ['How badly the whole thing scared him', 'How angry the photo of his face made him', 'How much being called uptight stung'], a: 0,
      cue: '「Making me think…」の中身と、super の言い方。',
      line: 'Making me think I was gonna, like, *die in federal prison*. Ah, that’s *super funny*.',
      said: '「連邦刑務所で死ぬかと思わせるなんて。いやあ、すごく面白い」と笑ってみせる。',
      mean: '笑いながら、本気で怖かったことを自分で言ってしまっている。super funny は無理に明るくした言い方。',
      trap: '直前の写真の話から怒りに聞こえやすい。言葉の中に、何が一番こたえたかが出ている。',
      use: 'Ha ha, very funny. You scared me.（はは、面白いね。びっくりしたよ）' }
  ]
};
